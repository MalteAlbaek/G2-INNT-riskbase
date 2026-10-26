"use server"

import { revalidatePath } from "next/cache"
import { toDataRoomDocument } from "@/features/compare/queries"
import type { DataRoomDocument } from "@/features/compare/types"
import { resolveOrgId } from "@/lib/org"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "project_documents"

type Result<T = undefined> = { ok: true; value?: T } | { ok: false; error: string }
const fail = (error: { message: string } | null | undefined): Result<never> => ({
  ok: false,
  error: error?.message ?? "Something went wrong",
})

function revalidateProject(projectId: string) {
  revalidatePath("/projects")
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/compare")
}

/** Creates a project in the user's organisation. */
export async function createProject(name: string): Promise<Result<{ id: string }>> {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: "Give the project a name" }

  const supabase = await createClient()
  const orgId = await resolveOrgId(supabase)
  if (!orgId) return { ok: false, error: "You are not a member of an organisation yet" }

  const { data, error } = await supabase
    .from("projects")
    .insert({ org_id: orgId, name: trimmed, status: "active" })
    .select("id")
    .single()
  if (error) return fail(error)
  revalidatePath("/projects")
  return { ok: true, value: { id: data.id } }
}

/** Records a file the browser has already uploaded to storage under <org_id>/<project_id>/. */
export async function registerDocument(input: {
  projectId: string
  storagePath: string
  fileName: string
  fileSize: number
  mimeType: string
}): Promise<Result<DataRoomDocument>> {
  const supabase = await createClient()
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("org_id")
    .eq("id", input.projectId)
    .single()
  if (projectError) return fail(projectError)

  const { data, error } = await supabase
    .from("documents")
    .insert({
      project_id: input.projectId,
      org_id: project.org_id,
      storage_path: input.storagePath,
      file_name: input.fileName,
      file_size: input.fileSize,
      mime_type: input.mimeType,
    })
    .select("id, file_name, file_size, created_at, description, uploaded_by")
    .single()
  if (error) return fail(error)

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", data.uploaded_by ?? "")
    .maybeSingle()
  revalidateProject(input.projectId)
  return { ok: true, value: toDataRoomDocument(data, () => profile?.full_name || profile?.email || "You") }
}

/**
 * Deletes a document and its files. Documents a screening is built on can't be deleted —
 * the database refuses, which keeps the evidence behind an assessment intact.
 */
export async function deleteDocument(documentId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: doc, error: readError } = await supabase
    .from("documents")
    .select("project_id, storage_path, md_storage_path")
    .eq("id", Number(documentId))
    .maybeSingle()
  if (readError) return fail(readError)
  if (!doc) return { ok: false, error: "Document not found" }

  // The database refuses documents a screening is built on, with an explanation.
  const { error } = await supabase.from("documents").delete().eq("id", Number(documentId))
  if (error) return fail(error)

  const paths = [doc.storage_path, doc.md_storage_path]
    .filter((p): p is string => !!p)
    .map((p) => p.replace(new RegExp(`^${BUCKET}/`), ""))
  await supabase.storage.from(BUCKET).remove(paths)

  if (doc.project_id) revalidateProject(doc.project_id)
  return { ok: true }
}

/**
 * Permanently deletes a project with its data room, screenings, reviews and assessments.
 * The caller must repeat the project's name — checked here, not only in the dialog.
 */
export async function deleteProject(projectId: string, confirmName: string): Promise<Result> {
  const supabase = await createClient()
  const { data: project, error: readError } = await supabase
    .from("projects")
    .select("name, documents(storage_path, md_storage_path)")
    .eq("id", projectId)
    .maybeSingle()
  if (readError) return fail(readError)
  if (!project) return { ok: false, error: "Project not found" }
  if (confirmName.trim() !== (project.name ?? "").trim()) {
    return { ok: false, error: "The name doesn't match the project" }
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId)
  if (error) return fail(error)

  // Files aren't covered by the database cascade; remove them once the rows are gone.
  const paths = project.documents
    .flatMap((d) => [d.storage_path, d.md_storage_path])
    .filter((p): p is string => !!p)
    .map((p) => p.replace(new RegExp(`^${BUCKET}/`), ""))
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)

  revalidatePath("/projects")
  revalidatePath("/compare")
  return { ok: true }
}

export async function addProjectComment(projectId: string, body: string): Promise<Result> {
  const text = body.trim()
  if (!text) return { ok: false, error: "Write a comment first" }
  const supabase = await createClient()
  const { error } = await supabase.from("project_comments").insert({ project_id: projectId, body: text })
  if (error) return fail(error)
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}

/** Saves an edited Markdown extraction next to the original file. */
export async function saveDocumentMarkdown(documentId: string, markdown: string): Promise<Result> {
  const supabase = await createClient()
  const { data: doc, error: readError } = await supabase
    .from("documents")
    .select("project_id, org_id, md_storage_path")
    .eq("id", Number(documentId))
    .maybeSingle()
  if (readError) return fail(readError)
  if (!doc?.project_id || !doc.org_id) return { ok: false, error: "Document not found" }

  const path = doc.md_storage_path?.replace(new RegExp(`^${BUCKET}/`), "") ?? `${doc.org_id}/${doc.project_id}/${documentId}.md`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([markdown], { type: "text/markdown" }), { upsert: true, contentType: "text/markdown" })
  if (error) return fail(error)

  if (!doc.md_storage_path) {
    const { error: updateError } = await supabase.from("documents").update({ md_storage_path: path }).eq("id", Number(documentId))
    if (updateError) return fail(updateError)
  }
  revalidatePath(`/projects/${doc.project_id}`)
  return { ok: true }
}
