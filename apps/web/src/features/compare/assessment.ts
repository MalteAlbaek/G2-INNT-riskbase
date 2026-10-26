import {
  finalScore,
  isDealbreaker,
  type CellReview,
  type Score,
  type SourceRef,
  type TemplateCategory,
  type TemplateField,
  type TemplateScreening,
} from "@/features/screenings"
import type { ReviewProgress } from "./types"

export interface Finding {
  field: TemplateField
  categoryName: string
  score: Score
  reviewed: boolean
  dealbreaker: boolean
  /** The reviewer's rationale when there is one, otherwise the AI finding. */
  text: string
  /** Evidence numbers into `CaseFile.evidence`. */
  refs: number[]
}

export interface Evidence {
  ref: number
  documentId?: string
  documentName: string
  page?: number
  /** The first passage cited on this page — what the viewer highlights. */
  quote: string
}

/** Everything the assessment is built on, derived from the reviewed criteria. */
export interface CaseFile {
  risks: Finding[]
  strengths: Finding[]
  /** Information gaps and follow-ups that are still unresolved. */
  open: { field: TemplateField; categoryName: string; note: string }[]
  evidence: Evidence[]
  progress: ReviewProgress
}

export function progressOf(screening: TemplateScreening, fields: TemplateField[], reviews: Record<string, CellReview> = {}): ReviewProgress {
  const scored = fields.filter((f) => screening.results[f.id])
  const open = scored.filter((f) => {
    const review = reviews[f.id]
    return review ? review.status === "follow_up" : screening.results[f.id]!.isGap
  }).length
  const reviewed = scored.filter((f) => reviews[f.id] && reviews[f.id]!.status !== "follow_up").length
  return { total: scored.length, reviewed, open }
}

/** AI-cited sources followed by those reviewers added themselves. */
export function sourcesOf(
  screening: TemplateScreening,
  fieldId: string,
  added: Record<string, SourceRef[]> = {}
): SourceRef[] {
  return [...(screening.results[fieldId]?.sources ?? []), ...(added[fieldId] ?? [])]
}

export function buildCase(
  screening: TemplateScreening,
  categories: TemplateCategory[],
  reviews: Record<string, CellReview> = {},
  added: Record<string, SourceRef[]> = {}
): CaseFile {
  const evidence: Evidence[] = []
  const refFor = (source: SourceRef) => {
    const existing = evidence.find((e) => e.documentName === source.documentName && e.page === source.page)
    if (existing) return existing.ref
    const ref = evidence.length + 1
    evidence.push({ ref, documentId: source.documentId, documentName: source.documentName, page: source.page, quote: source.quote })
    return ref
  }

  const findings: Finding[] = []
  const open: CaseFile["open"] = []

  for (const category of categories) {
    for (const field of category.fields) {
      const result = screening.results[field.id]
      const review = reviews[field.id]
      // Criteria the AI didn't assess only count once a reviewer has assessed them.
      if (!result && !review) continue

      if (review ? review.status === "follow_up" : result!.isGap) {
        open.push({ field, categoryName: category.name, note: review?.rationale || field.gapInstruction || "Information gap" })
        continue
      }

      const score = finalScore(result, review)
      if (score === null || score === 0) continue
      findings.push({
        field,
        categoryName: category.name,
        score,
        reviewed: !!review,
        dealbreaker: isDealbreaker(field, result, review),
        text: review?.rationale || result?.extractedContent || "",
        refs: [],
      })
    }
  }

  // Most severe risks and strongest positives first; number evidence in reading order.
  const risks = findings.filter((f) => f.score < 0).sort((a, b) => a.score - b.score || b.field.weight - a.field.weight)
  const strengths = findings.filter((f) => f.score > 0).sort((a, b) => b.score - a.score || b.field.weight - a.field.weight)
  for (const finding of [...risks, ...strengths]) {
    finding.refs = sourcesOf(screening, finding.field.id, added).map(refFor)
  }

  return {
    risks,
    strengths,
    open,
    evidence,
    progress: progressOf(screening, categories.flatMap((c) => c.fields), reviews),
  }
}
