import { createClient } from "@/lib/supabase/server"
import { fromJsonSchema } from "./key-facts"
import type { TemplateConfig, TemplateListItem } from "./types"

export async function listTemplates(): Promise<TemplateListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("template_overview").select("*").order("name")
  if (error) throw error
  return data.map((t) => ({
    id: String(t.id),
    name: t.name ?? "Untitled template",
    description: t.description ?? "",
    categories: t.category_count ?? 0,
    fields: t.field_count ?? 0,
    required: t.required_count ?? 0,
    db: t.dealbreaker_count ?? 0,
    gapFields: t.gap_field_count ?? 0,
    screenings: t.screening_count ?? 0,
  }))
}

/** A template with its categories and fields in display order. Null when not found. */
export async function loadTemplate(templateId: string): Promise<TemplateConfig | null> {
  const id = Number(templateId)
  if (!Number.isInteger(id)) return null
  const supabase = await createClient()

  const [templateRes, categoriesRes, usageRes] = await Promise.all([
    supabase.from("template_overview").select("id, name, description, screening_count").eq("id", id).maybeSingle(),
    supabase
      .from("schema_categories")
      .select(
        "id, name, weight, description, display_order, schema_field(id, name, weight, is_required, is_dealbreaker, extraction_description, gap_description, display_order, output_schema)"
      )
      .eq("template_id", id)
      .order("display_order")
      .order("id"),
    supabase.from("screening_field_results").select("schema_field_id"),
  ])
  for (const res of [templateRes, categoriesRes, usageRes]) if (res.error) throw res.error
  const template = templateRes.data
  if (!template) return null

  const used = new Set(usageRes.data!.map((r) => r.schema_field_id))

  return {
    id: String(template.id),
    name: template.name ?? "Untitled template",
    description: template.description ?? "",
    screeningCount: template.screening_count ?? 0,
    categories: categoriesRes.data!.map((c) => ({
      id: String(c.id),
      name: c.name,
      weight: Number(c.weight ?? 0.5),
      description: c.description ?? "",
      fields: [...c.schema_field]
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id)
        .map((f) => ({
          id: String(f.id),
          name: f.name,
          weight: Number(f.weight ?? 0.5),
          required: !!f.is_required,
          dealbreaker: !!f.is_dealbreaker,
          extractionPrompt: f.extraction_description ?? "",
          gapInstruction: f.gap_description ?? "",
          keyFacts: fromJsonSchema(f.output_schema),
          inUse: used.has(f.id),
        })),
    })),
  }
}
