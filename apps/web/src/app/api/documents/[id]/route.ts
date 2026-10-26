import { createClient } from "@/lib/supabase/server"

const BUCKET = "project_documents"

// Streams a data room document from private storage. Both the row lookup and the
// download run with the signed-in user's rights, so RLS decides who gets the file.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const documentId = Number(id)
  if (!Number.isInteger(documentId)) return new Response("Not found", { status: 404 })

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, file_name, mime_type")
    .eq("id", documentId)
    .maybeSingle()
  if (!doc) return new Response("Not found", { status: 404 })

  // Older rows store the path with the bucket name in front.
  const path = doc.storage_path.replace(new RegExp(`^${BUCKET}/`), "")
  const { data: file, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !file) return new Response("File not available", { status: 404 })

  return new Response(file, {
    headers: {
      "Content-Type": doc.mime_type ?? "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.file_name)}`,
      "Cache-Control": "private, max-age=300",
    },
  })
}
