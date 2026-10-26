import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TemplateEditor } from "@/features/templates"
import { loadTemplate } from "@/features/templates/queries"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const template = await loadTemplate((await params).id)
  return { title: template ? `${template.name} · Riskbase` : "Template · Riskbase" }
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const template = await loadTemplate((await params).id)
  if (!template) notFound()
  return <TemplateEditor template={template} />
}
