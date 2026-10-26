"use client"

import type { DataRoomDocument } from "@/features/compare/types"
import { createClient } from "@/lib/supabase/client"
import { registerDocument } from "./actions"

/**
 * Uploads files straight from the browser to the private bucket under
 * <org_id>/<project_id>/ (storage RLS checks membership), then records each one.
 */
export async function uploadDocuments(
  project: { id: string; orgId: string },
  files: File[]
): Promise<{ uploaded: DataRoomDocument[]; errors: string[] }> {
  const supabase = createClient()
  const uploaded: DataRoomDocument[] = []
  const errors: string[] = []

  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_")
    const storagePath = `${project.orgId}/${project.id}/${crypto.randomUUID()}-${safeName}`
    const mimeType = file.type || "application/pdf"
    const { error } = await supabase.storage.from("project_documents").upload(storagePath, file, { contentType: mimeType })
    if (error) {
      errors.push(`${file.name}: ${error.message}`)
      continue
    }
    const result = await registerDocument({
      projectId: project.id,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    })
    if (result.ok && result.value) uploaded.push(result.value)
    else if (!result.ok) errors.push(`${file.name}: ${result.error}`)
  }
  return { uploaded, errors }
}
