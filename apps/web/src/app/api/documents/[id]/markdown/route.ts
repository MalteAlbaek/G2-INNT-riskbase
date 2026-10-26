import { createClient } from "@/lib/supabase/server"

const BUCKET = "project_documents"

// The document's Markdown extraction, read with the signed-in user's rights.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const documentId = Number(id)
  if (!Number.isInteger(documentId)) return new Response("Not found", { status: 404 })

  const supabase = await createClient()
  const { data: doc } = await supabase.from("documents").select("md_storage_path").eq("id", documentId).maybeSingle()
  if (!doc?.md_storage_path) return new Response("No Markdown extraction", { status: 404 })

  const { data: file, error } = await supabase.storage
    .from(BUCKET)
    .download(doc.md_storage_path.replace(new RegExp(`^${BUCKET}/`), ""))
  if (error || !file) return new Response("No Markdown extraction", { status: 404 })

  return new Response(await file.text(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "private, no-store" },
  })
}
