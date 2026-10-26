import type { Metadata } from "next"
import { TemplatesTable } from "@/features/templates"
import { listTemplates } from "@/features/templates/queries"

export const metadata: Metadata = {
  title: "Templates · Riskbase",
}

export default async function TemplatesPage() {
  const templates = await listTemplates()
  return <TemplatesTable templates={templates} />
}
