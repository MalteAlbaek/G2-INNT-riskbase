import type { CellReview, FieldResult, Score, TemplateField, TemplateScreening } from "./types"

/** Maps a -2…+2 score onto 0…1. */
export function normalizeScore(score: number): number {
  return (score + 2) / 4
}

/** The score that counts: the reviewer's when reviewed, otherwise the AI proposal. */
export function finalScore(result: FieldResult | undefined, review: CellReview | undefined): Score | null {
  if (review) return review.score
  if (!result || result.isGap) return null
  return result.score
}

export function isDealbreaker(
  field: TemplateField,
  result: FieldResult | undefined,
  review?: CellReview
): boolean {
  return field.isDealbreakerField && finalScore(result, review) === -2
}

/**
 * Weighted 0…1 score across the given fields only — lets projects be compared
 * on the criteria in scope rather than the template as a whole.
 * Uses reviewed scores where they exist. Unreviewed gaps are excluded;
 * returns null when nothing in scope has a score.
 */
export function scopeScore(
  screening: TemplateScreening,
  fields: TemplateField[],
  reviews: Record<string, CellReview> = {}
): number | null {
  let weighted = 0
  let totalWeight = 0
  for (const field of fields) {
    const score = finalScore(screening.results[field.id], reviews[field.id])
    if (score === null) continue
    weighted += field.weight * normalizeScore(score)
    totalWeight += field.weight
  }
  return totalWeight > 0 ? weighted / totalWeight : null
}

export function formatScore(score: Score): string {
  return score > 0 ? `+${score}` : String(score)
}
