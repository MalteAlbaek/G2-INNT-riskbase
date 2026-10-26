import type { Database } from "@riskbase/db-types"
import { fromJsonSchema, type FactValue } from "@/features/templates/key-facts"
import type {
  CellEvent,
  CellFacts,
  CellReview,
  FieldResult,
  ProspectAssessment,
  Score,
  ScreeningStatus,
  SourceRef,
  TemplateScreening,
  TemplateScreenings,
} from "@/features/screenings"
import { scopeScore } from "@/features/screenings"
import { createClient } from "@/lib/supabase/server"
import { cellKey } from "./review-state"
import type { CompareProject, DataRoomDocument } from "./types"

type Enums = Database["public"]["Enums"]

const STATUS_LABEL: Record<Enums["screening_status"], ScreeningStatus> = {
  draft: "Draft",
  in_progress: "In progress",
  review: "Review",
  completed: "Completed",
}

export interface CompareData {
  templates: { id: string; name: string }[]
  data: TemplateScreenings
  projects: Record<string, CompareProject>
  currentUser: string
  initialReviews: Record<string, Record<string, CellReview>>
  initialEvents: Record<string, CellEvent[]>
  initialAddedSources: Record<string, Record<string, SourceRef[]>>
  initialAssessments: Record<string, ProspectAssessment>
  /** screeningId → facts per criterion */
  initialFacts: Record<string, CellFacts>
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return ""
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Copenhagen",
  })
}

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "—"
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const clampScore = (value: number | null | undefined): Score =>
  Math.max(-2, Math.min(2, Math.round(value ?? 0))) as Score

/**
 * Everything the comparison view needs for one template, read with the signed-in
 * user's rights (RLS). Returns null when the user has no screenings to compare.
 */
export async function loadCompareData(templateId?: string): Promise<CompareData | null> {
  const supabase = await createClient()

  const [{ data: claims }, { data: templateRows, error: templateError }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("schema_templates").select("id, name, screenings(id)").order("name"),
  ])
  if (templateError) throw templateError

  const templates = (templateRows ?? []).filter((t) => t.screenings.length > 0)
  if (templates.length === 0) return null
  const template =
    templates.find((t) => String(t.id) === templateId) ??
    [...templates].sort((a, b) => b.screenings.length - a.screenings.length)[0]!

  const [categoriesRes, screeningsRes, profilesRes] = await Promise.all([
    supabase
      .from("schema_categories")
      .select(
        "id, name, weight, description, display_order, schema_field(id, name, weight, is_required, is_dealbreaker, extraction_description, gap_description, display_order, output_schema)"
      )
      .eq("template_id", template.id)
      .order("display_order"),
    supabase
      .from("screenings")
      .select("id, status, created_at, started_at, ended_at, project:projects(id, name, org_id)")
      .eq("schema_template_id", template.id)
      .order("created_at"),
    supabase.from("profiles").select("id, full_name, email"),
  ])
  for (const res of [categoriesRes, screeningsRes, profilesRes]) if (res.error) throw res.error

  const nameOf = (userId: string | null | undefined) => {
    const p = profilesRes.data!.find((x) => x.id === userId)
    return p?.full_name || p?.email || "Unknown"
  }

  const screeningRows = screeningsRes.data!.filter((s) => s.project)
  const screeningIds = screeningRows.map((s) => s.id)
  const projectIds = [...new Set(screeningRows.map((s) => s.project!.id))]

  const [resultsRes, evidenceRes, reviewsRes, eventsRes, assessmentsRes, documentsRes, factsRes] = await Promise.all([
    supabase.from("screening_field_results").select("*").in("screening_id", screeningIds),
    supabase
      .from("evidence")
      .select("id, screening_id, schema_field_id, document_id, page, quote, reference, added_by, created_at, document:documents(file_name)")
      .in("screening_id", screeningIds)
      .order("created_at"),
    supabase.from("field_reviews").select("*").in("screening_id", screeningIds),
    supabase.from("field_review_events").select("*").in("screening_id", screeningIds).order("created_at"),
    supabase.from("screening_assessments").select("*").in("screening_id", screeningIds),
    supabase
      .from("documents")
      .select("id, project_id, file_name, file_size, created_at, description, uploaded_by")
      .in("project_id", projectIds)
      .order("created_at"),
    supabase.from("fact_values").select("*").in("screening_id", screeningIds),
  ])
  for (const res of [resultsRes, evidenceRes, reviewsRes, eventsRes, assessmentsRes, documentsRes, factsRes]) {
    if (res.error) throw res.error
  }

  // ── Template structure ──
  const categories = categoriesRes.data!.map((c) => ({
    id: String(c.id),
    name: c.name,
    weight: c.weight != null ? Number(c.weight) : undefined,
    description: c.description ?? "",
    fields: [...c.schema_field]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((f) => ({
        id: String(f.id),
        name: f.name,
        weight: Number(f.weight ?? 0.5),
        isDealbreakerField: !!f.is_dealbreaker,
        required: !!f.is_required,
        extractionPrompt: f.extraction_description ?? "",
        gapInstruction: f.gap_description ?? "",
        keyFacts: fromJsonSchema(f.output_schema),
      })),
  }))
  const allFields = categories.flatMap((c) => c.fields)

  // ── Evidence: AI citations travel with the result; reviewer citations are separate ──
  const toSource = (e: NonNullable<typeof evidenceRes.data>[number]): SourceRef => ({
    documentId: e.document_id != null ? String(e.document_id) : undefined,
    documentName: e.document?.file_name ?? e.reference ?? "Source",
    page: e.page ?? undefined,
    quote: e.quote ?? e.reference ?? "",
    addedBy: e.added_by ? nameOf(e.added_by) : undefined,
    addedAt: e.added_by ? formatTimestamp(e.created_at) : undefined,
  })
  const aiSources: Record<string, SourceRef[]> = {}
  const initialAddedSources: CompareData["initialAddedSources"] = {}
  for (const e of evidenceRes.data!) {
    const sid = String(e.screening_id)
    const fid = String(e.schema_field_id)
    if (e.added_by) {
      initialAddedSources[sid] ??= {}
      ;(initialAddedSources[sid][fid] ??= []).push(toSource(e))
    } else {
      ;(aiSources[cellKey(sid, fid)] ??= []).push(toSource(e))
    }
  }

  // ── Screenings with one AI proposal per criterion ──
  const screenings: TemplateScreening[] = screeningRows.map((s) => {
    const sid = String(s.id)
    const results: Record<string, FieldResult> = {}
    for (const r of resultsRes.data!.filter((x) => x.screening_id === s.id)) {
      const fid = String(r.schema_field_id)
      results[fid] = {
        score: clampScore(r.ai_score),
        confidence: Math.round(Number(r.confidence ?? 0) * 100),
        extractedContent: r.finding ?? "",
        isGap: !!r.is_gap,
        sources: aiSources[cellKey(sid, fid)] ?? [],
      }
    }
    const screening: TemplateScreening = {
      id: sid,
      projectId: s.project!.id,
      project: s.project!.name ?? "Untitled project",
      status: STATUS_LABEL[s.status],
      screenedAt: formatTimestamp(s.ended_at ?? s.started_at ?? s.created_at),
      files: [],
      maut: 0,
      results,
    }
    screening.maut = scopeScore(screening, allFields) ?? 0
    return screening
  })

  // ── Reviews, history, assessments ──
  const initialReviews: CompareData["initialReviews"] = {}
  for (const r of reviewsRes.data!) {
    initialReviews[String(r.screening_id)] ??= {}
    initialReviews[String(r.screening_id)]![String(r.schema_field_id)] = {
      status: r.status,
      score: clampScore(r.score),
      rationale: r.rationale,
      reviewer: nameOf(r.reviewed_by),
      reviewedAt: formatTimestamp(r.reviewed_at),
    }
  }

  const initialEvents: CompareData["initialEvents"] = {}
  for (const e of eventsRes.data!) {
    ;(initialEvents[cellKey(String(e.screening_id), String(e.schema_field_id))] ??= []).push({
      id: `db-${e.id}`,
      type: e.type,
      actor: nameOf(e.actor),
      at: formatTimestamp(e.created_at),
      text: e.text ?? undefined,
      fromScore: e.from_score != null ? clampScore(e.from_score) : undefined,
      toScore: e.to_score != null ? clampScore(e.to_score) : undefined,
    })
  }

  const initialAssessments: CompareData["initialAssessments"] = {}
  for (const a of assessmentsRes.data!) {
    initialAssessments[String(a.screening_id)] = {
      status: a.status,
      conclusion: a.conclusion,
      recommendation: a.recommendation,
      author: nameOf(a.author),
      updatedAt: formatTimestamp(a.updated_at),
    }
  }

  // ── Key facts ──
  const initialFacts: CompareData["initialFacts"] = {}
  for (const f of factsRes.data!) {
    const cell = ((initialFacts[String(f.screening_id)] ??= {})[String(f.schema_field_id)] ??= {})
    const entry = (cell[f.property_key] ??= {})
    const value = f.value as FactValue
    if (f.source === "ai") entry.ai = value
    else entry.reviewer = { value, by: nameOf(f.set_by), at: formatTimestamp(f.updated_at) }
  }

  // ── Data rooms ──
  const projects: Record<string, CompareProject> = {}
  for (const s of screeningRows) {
    const p = s.project!
    projects[p.id] = {
      id: p.id,
      orgId: p.org_id,
      name: p.name ?? "Untitled project",
      documents: documentsRes.data!.filter((d) => d.project_id === p.id).map((d) => toDataRoomDocument(d, nameOf)),
    }
  }

  return {
    templates: templates.map((t) => ({ id: String(t.id), name: t.name ?? "Untitled template" })),
    data: { id: String(template.id), name: template.name ?? "Untitled template", categories, screenings },
    projects,
    currentUser: nameOf(claims?.claims.sub),
    initialReviews,
    initialEvents,
    initialAddedSources,
    initialAssessments,
    initialFacts,
  }
}

export function toDataRoomDocument(
  d: {
    id: number
    file_name: string
    file_size: number | null
    created_at: string
    description: string | null
    uploaded_by: string | null
  },
  nameOf: (userId: string | null) => string
): DataRoomDocument {
  return {
    id: String(d.id),
    name: d.file_name,
    size: formatSize(d.file_size),
    uploadedAt: formatTimestamp(d.created_at),
    status: "ready",
    description: d.description ?? undefined,
    url: `/api/documents/${d.id}`,
    addedBy: d.uploaded_by ? nameOf(d.uploaded_by) : undefined,
  }
}
