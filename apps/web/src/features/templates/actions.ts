"use server"

import { revalidatePath } from "next/cache"
import { resolveOrgId } from "@/lib/org"
import { toJsonSchema, validateFacts, type FactProperty } from "./key-facts"
import { createClient } from "@/lib/supabase/server"

type Result<T = undefined> = { ok: true; value?: T } | { ok: false; error: string }
const fail = (error: { message: string } | null | undefined): Result<never> => ({
  ok: false,
  error: error?.message ?? "Something went wrong",
})

/** Stable machine identifier for the AI pipeline, e.g. "Støj vej" → "stoej_vej". */
function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .slice(0, 60)
}

function revalidateTemplate(templateId?: string) {
  revalidatePath("/templates")
  if (templateId) revalidatePath(`/templates/${templateId}`)
  revalidatePath("/compare")
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function createTemplate(input: { name: string; description?: string }): Promise<Result<{ id: string }>> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Give the template a name" }
  const supabase = await createClient()
  const orgId = await resolveOrgId(supabase)
  if (!orgId) return { ok: false, error: "You are not a member of an organisation yet" }

  const { data, error } = await supabase
    .from("schema_templates")
    .insert({ name, description: input.description?.trim() || null, org_id: orgId })
    .select("id")
    .single()
  if (error) return fail(error)
  revalidateTemplate()
  return { ok: true, value: { id: String(data.id) } }
}

export async function updateTemplate(templateId: string, input: { name?: string; description?: string }): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("schema_templates")
    .update({
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() || null }),
    })
    .eq("id", Number(templateId))
  if (error) return fail(error)
  revalidateTemplate(templateId)
  return { ok: true }
}

export async function deleteTemplate(templateId: string): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from("schema_templates").delete().eq("id", Number(templateId))
  if (error) return fail(error)
  revalidateTemplate()
  return { ok: true }
}

export async function duplicateTemplate(templateId: string): Promise<Result<{ id: string }>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("duplicate_template", { p_template_id: Number(templateId) })
  if (error) return fail(error)
  revalidateTemplate()
  return { ok: true, value: { id: String(data) } }
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface CategoryInput {
  name: string
  /** 0…1 */
  weight: number
  description: string
}

export async function createCategory(templateId: string, input: CategoryInput): Promise<Result<{ id: string }>> {
  const supabase = await createClient()
  const { data: last } = await supabase
    .from("schema_categories")
    .select("display_order")
    .eq("template_id", Number(templateId))
    .order("display_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from("schema_categories")
    .insert({
      template_id: Number(templateId),
      name: input.name.trim(),
      code: slug(input.name),
      weight: input.weight,
      description: input.description.trim() || null,
      display_order: (last?.display_order ?? 0) + 1,
    })
    .select("id")
    .single()
  if (error) return fail(error)
  revalidateTemplate(templateId)
  return { ok: true, value: { id: String(data.id) } }
}

export async function updateCategory(templateId: string, categoryId: string, input: CategoryInput): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("schema_categories")
    .update({ name: input.name.trim(), weight: input.weight, description: input.description.trim() || null })
    .eq("id", Number(categoryId))
  if (error) return fail(error)
  revalidateTemplate(templateId)
  return { ok: true }
}

export async function deleteCategory(templateId: string, categoryId: string): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from("schema_categories").delete().eq("id", Number(categoryId))
  if (error) return fail(error)
  revalidateTemplate(templateId)
  return { ok: true }
}

/** Swaps an item with its neighbour and renumbers the list 1…n so the order is unambiguous. */
async function reorder(
  table: "schema_categories" | "schema_field",
  orderedIds: number[],
  itemId: number,
  dir: "up" | "down"
): Promise<Result> {
  const supabase = await createClient()
  const ids = [...orderedIds]
  const idx = ids.indexOf(itemId)
  const target = dir === "up" ? idx - 1 : idx + 1
  if (idx < 0 || target < 0 || target >= ids.length) return { ok: true }
  ;[ids[idx], ids[target]] = [ids[target]!, ids[idx]!]

  const results = await Promise.all(ids.map((id, i) => supabase.from(table).update({ display_order: i + 1 }).eq("id", id)))
  const failed = results.find((r) => r.error)
  return failed ? fail(failed.error) : { ok: true }
}

export async function moveCategory(templateId: string, categoryId: string, dir: "up" | "down"): Promise<Result> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("schema_categories")
    .select("id")
    .eq("template_id", Number(templateId))
    .order("display_order", { nullsFirst: false })
    .order("id")
  if (error) return fail(error)
  const result = await reorder("schema_categories", data.map((r) => r.id), Number(categoryId), dir)
  revalidateTemplate(templateId)
  return result
}

// ─── Fields ──────────────────────────────────────────────────────────────────

export interface FieldInput {
  name: string
  /** 0…1 */
  weight: number
  required: boolean
  dealbreaker: boolean
  extractionPrompt: string
  gapInstruction: string
  /** Leave out to keep the current key facts. */
  keyFacts?: FactProperty[]
}

const fieldColumns = (input: FieldInput) => ({
  ...(input.keyFacts !== undefined && { output_schema: toJsonSchema(input.keyFacts) }),
  name: input.name.trim(),
  weight: input.weight,
  // A dealbreaker must always be scored.
  is_required: input.required || input.dealbreaker,
  is_dealbreaker: input.dealbreaker,
  extraction_description: input.extractionPrompt.trim() || null,
  gap_description: input.gapInstruction.trim() || null,
})

export async function createField(templateId: string, categoryId: string, input: FieldInput): Promise<Result<{ id: string }>> {
  const supabase = await createClient()
  const { data: last } = await supabase
    .from("schema_field")
    .select("display_order")
    .eq("category_id", Number(categoryId))
    .order("display_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  const { data: claims } = await supabase.auth.getClaims()
  const { data, error } = await supabase
    .from("schema_field")
    .insert({
      category_id: Number(categoryId),
      semantic_id: slug(input.name),
      display_order: (last?.display_order ?? 0) + 1,
      created_by: claims?.claims.sub ?? null,
      ...fieldColumns(input),
    })
    .select("id")
    .single()
  if (error) return fail(error)
  revalidateTemplate(templateId)
  return { ok: true, value: { id: String(data.id) } }
}

export async function updateField(templateId: string, fieldId: string, input: FieldInput): Promise<Result> {
  if (input.keyFacts && Object.keys(validateFacts(input.keyFacts)).length > 0) {
    return { ok: false, error: "Fix the highlighted key facts before saving" }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("schema_field").update(fieldColumns(input)).eq("id", Number(fieldId))
  if (error) return fail(error)
  revalidateTemplate(templateId)
  return { ok: true }
}

export async function deleteField(templateId: string, fieldId: string): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from("schema_field").delete().eq("id", Number(fieldId))
  if (error) return fail(error)
  revalidateTemplate(templateId)
  return { ok: true }
}

export async function moveField(templateId: string, categoryId: string, fieldId: string, dir: "up" | "down"): Promise<Result> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("schema_field")
    .select("id")
    .eq("category_id", Number(categoryId))
    .order("display_order", { nullsFirst: false })
    .order("id")
  if (error) return fail(error)
  const result = await reorder("schema_field", data.map((r) => r.id), Number(fieldId), dir)
  revalidateTemplate(templateId)
  return result
}
