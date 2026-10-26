import { redirect } from "next/navigation"

// The cross-project comparison now lives in /compare.
export default async function TemplateScreeningsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/compare?template=${encodeURIComponent(id)}`)
}
