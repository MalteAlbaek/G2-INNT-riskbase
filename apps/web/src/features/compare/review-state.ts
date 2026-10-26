import type { CellEvent, CellFacts, CellReview, ProspectAssessment, SourceRef } from "@/features/screenings"
import type { FactValue } from "@/features/templates/key-facts"
import type { DataRoomDocument } from "./types"

/**
 * Client-side review state for the comparison view. Current values plus an append-only
 * history, so it maps directly onto tables once the backend exists
 * (cell_reviews, cell_events, prospect_assessments, documents, evidence).
 */
export interface ReviewState {
  /** screeningId → fieldId → current review */
  reviews: Record<string, Record<string, CellReview>>
  /** `${screeningId}:${fieldId}` → events recorded this session */
  events: Record<string, CellEvent[]>
  /** screeningId → assessment */
  assessments: Record<string, ProspectAssessment>
  /** projectId → documents uploaded this session */
  uploads: Record<string, DataRoomDocument[]>
  /** screeningId → fieldId → evidence cited by reviewers */
  addedSources: Record<string, Record<string, SourceRef[]>>
  /** screeningId → key facts per criterion */
  facts: Record<string, CellFacts>
  seq: number
}

export type ReviewAction =
  | { type: "review"; screeningId: string; fieldId: string; review: CellReview; aiScore: CellReview["score"] }
  | { type: "reopen"; screeningId: string; fieldId: string; actor: string; at: string }
  | { type: "save_assessment"; screeningId: string; assessment: ProspectAssessment }
  | { type: "upload"; projectId: string; documents: DataRoomDocument[] }
  | { type: "add_source"; screeningId: string; fieldId: string; source: SourceRef & { addedBy: string; addedAt: string } }
  | { type: "set_fact"; screeningId: string; fieldId: string; key: string; value: FactValue | null; by: string; at: string }

export const cellKey = (screeningId: string, fieldId: string) => `${screeningId}:${fieldId}`

function appendEvent(state: ReviewState, key: string, event: Omit<CellEvent, "id">): ReviewState {
  return {
    ...state,
    seq: state.seq + 1,
    events: { ...state.events, [key]: [...(state.events[key] ?? []), { id: `e-${state.seq}`, ...event }] },
  }
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "review": {
      const { screeningId, fieldId, review, aiScore } = action
      const next: ReviewState = {
        ...state,
        reviews: { ...state.reviews, [screeningId]: { ...state.reviews[screeningId], [fieldId]: review } },
      }
      return appendEvent(next, cellKey(screeningId, fieldId), {
        type: review.status,
        actor: review.reviewer,
        at: review.reviewedAt,
        text: review.rationale || undefined,
        fromScore: review.status === "overridden" ? aiScore : undefined,
        toScore: review.status === "overridden" ? review.score : undefined,
      })
    }
    case "reopen": {
      const { screeningId, fieldId, actor, at } = action
      const rest = { ...state.reviews[screeningId] }
      delete rest[fieldId]
      const next: ReviewState = { ...state, reviews: { ...state.reviews, [screeningId]: rest } }
      return appendEvent(next, cellKey(screeningId, fieldId), { type: "reopened", actor, at })
    }
    case "save_assessment":
      return { ...state, assessments: { ...state.assessments, [action.screeningId]: action.assessment } }
    case "upload":
      return {
        ...state,
        uploads: { ...state.uploads, [action.projectId]: [...(state.uploads[action.projectId] ?? []), ...action.documents] },
      }
    case "set_fact": {
      const { screeningId, fieldId, key, value, by, at } = action
      const screening = state.facts[screeningId] ?? {}
      const cell = screening[fieldId] ?? {}
      const entry = { ...cell[key] }
      if (value === null) delete entry.reviewer
      else entry.reviewer = { value, by, at }
      const next: ReviewState = {
        ...state,
        facts: { ...state.facts, [screeningId]: { ...screening, [fieldId]: { ...cell, [key]: entry } } },
      }
      return appendEvent(next, cellKey(screeningId, fieldId), {
        type: "fact_updated",
        actor: by,
        at,
        text: value === null ? `${key} cleared` : `${key}: ${value}`,
      })
    }
    case "add_source": {
      const { screeningId, fieldId, source } = action
      const forScreening = state.addedSources[screeningId] ?? {}
      const next: ReviewState = {
        ...state,
        addedSources: {
          ...state.addedSources,
          [screeningId]: { ...forScreening, [fieldId]: [...(forScreening[fieldId] ?? []), source] },
        },
      }
      return appendEvent(next, cellKey(screeningId, fieldId), {
        type: "evidence_added",
        actor: source.addedBy,
        at: source.addedAt,
        text: `“${source.quote}” — ${source.documentName}, p. ${source.page}`,
      })
    }
  }
}

/** Human-readable timestamp in the same style as the mock data. */
export function nowLabel(): string {
  return new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
}
