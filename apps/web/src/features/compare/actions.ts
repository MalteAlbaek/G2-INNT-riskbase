"use server"

import { revalidatePath } from "next/cache"
import type { Database } from "@riskbase/db-types"
import type { FactValue } from "@/features/templates/key-facts"
import { createClient } from "@/lib/supabase/server"

type Enums = Database["public"]["Enums"]
type Result<T = undefined> = { ok: true; value?: T } | { ok: false; error: string }

const fail = (error: { message: string } | null | undefined): Result<never> => ({
  ok: false,
  error: error?.message ?? "Something went wrong",
})

export async function saveFieldReview(input: {
  screeningId: string
  fieldId: string
  status: Enums["review_status"]
  score: number
  aiScore: number | null
  rationale: string
}): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from("field_reviews").upsert({
    screening_id: Number(input.screeningId),
    schema_field_id: Number(input.fieldId),
    status: input.status,
    score: input.score,
    ai_score: input.aiScore,
    rationale: input.rationale,
  })
  if (error) return fail(error)
  revalidatePath("/compare")
  return { ok: true }
}

export async function reopenFieldReview(input: { screeningId: string; fieldId: string }): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("field_reviews")
    .delete()
    .eq("screening_id", Number(input.screeningId))
    .eq("schema_field_id", Number(input.fieldId))
  if (error) return fail(error)
  revalidatePath("/compare")
  return { ok: true }
}

export async function addEvidence(input: {
  screeningId: string
  fieldId: string
  documentId: string
  page: number
  quote: string
}): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from("evidence").insert({
    screening_id: Number(input.screeningId),
    schema_field_id: Number(input.fieldId),
    document_id: Number(input.documentId),
    page: input.page,
    quote: input.quote,
  })
  if (error) return fail(error)
  revalidatePath("/compare")
  return { ok: true }
}

export async function saveAssessment(input: {
  screeningId: string
  conclusion: string
  recommendation: Enums["recommendation"] | null
  status: Enums["assessment_status"]
}): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from("screening_assessments").upsert({
    screening_id: Number(input.screeningId),
    conclusion: input.conclusion,
    recommendation: input.recommendation,
    status: input.status,
  })
  // The database enforces the finalisation rules; pass its explanation through.
  if (error) return fail(error)
  revalidatePath("/compare")
  return { ok: true }
}

/** Sets the reviewer's value for a key fact; null clears it so the AI's value shows again. */
export async function setFactValue(input: {
  screeningId: string
  fieldId: string
  key: string
  value: FactValue | null
}): Promise<Result> {
  const supabase = await createClient()
  const match = {
    screening_id: Number(input.screeningId),
    schema_field_id: Number(input.fieldId),
    property_key: input.key,
    source: "reviewer" as const,
  }
  const { error } =
    input.value === null
      ? await supabase.from("fact_values").delete().match(match)
      : await supabase.from("fact_values").upsert({ ...match, value: input.value })
  // The database checks the value against the criterion's schema.
  if (error) return fail(error)
  revalidatePath("/compare")
  return { ok: true }
}
