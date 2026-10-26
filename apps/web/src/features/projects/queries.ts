import type { Database } from "@riskbase/db-types"
import { formatSize, formatTimestamp } from "@/features/compare/queries"
import type { Recommendation, ScreeningStatus } from "@/features/screenings"
import { normalizeScore } from "@/features/screenings"
import { createClient } from "@/lib/supabase/server"

type Enums = Database["public"]["Enums"]

const SCREENING_STATUS: Record<Enums["screening_status"], ScreeningStatus> = {
  draft: "Draft",
  in_progress: "In progress",
  review: "Review",
  completed: "Completed",
}

/** "active" → "Active" — project status is free text in the database. */
const statusLabel = (status: string | null) => (status ? status[0]!.toUpperCase() + status.slice(1) : "Active")

export interface ProjectListItem {
  id: string
  name: string
  status: string
  documents: number
  screenings: number
  lastScreenedAt: string
  createdAt: string
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("project_overview").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data.map((p) => ({
    id: p.id!,
    name: p.name ?? "Untitled project",
    status: statusLabel(p.status),
    documents: p.document_count ?? 0,
    screenings: p.screening_count ?? 0,
    lastScreenedAt: p.last_screened_at ? formatTimestamp(p.last_screened_at) : "—",
    createdAt: formatTimestamp(p.created_at),
  }))
}

export interface ProjectDocumentItem {
  id: string
  name: string
  size: string
  uploadedAt: string
  uploadedBy?: string
  description?: string
  hasMarkdown: boolean
  /** Number of screenings that include the document — it can't be deleted while used. */
  usedInScreenings: number
}

export interface ProjectScreeningItem {
  id: string
  templateId: string | null
  template: string
  status: ScreeningStatus
  /** Weighted 0…1 score — reviewed scores where they exist, otherwise the AI proposal. */
  score: number | null
  reviewed: number
  total: number
  recommendation: Recommendation | null
  screenedAt: string
}

export interface ProjectActivityItem {
  id: string
  type: "created" | "upload" | "screening" | "assessment" | "comment"
  actor: string
  actorId: string | null
  message: string
  body?: string
  timestamp: string
}

export interface ProjectDetailData {
  id: string
  orgId: string
  name: string
  status: string
  createdAt: string
  documents: ProjectDocumentItem[]
  screenings: ProjectScreeningItem[]
  activity: ProjectActivityItem[]
  currentUser: { id: string; name: string }
}

const RECOMMENDATION_TEXT: Record<Recommendation, string> = {
  go: "Proceed",
  hold: "Hold",
  no_go: "Do not proceed",
}

/** Everything the project page shows, read with the user's rights. Null when not found. */
export async function loadProject(projectId: string): Promise<ProjectDetailData | null> {
  const supabase = await createClient()

  const [{ data: claims }, projectRes] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("projects").select("id, org_id, name, status, created_at").eq("id", projectId).maybeSingle(),
  ])
  if (projectRes.error) {
    // An invalid uuid is just "not found".
    if (projectRes.error.code === "22P02") return null
    throw projectRes.error
  }
  const project = projectRes.data
  if (!project) return null

  const [documentsRes, screeningsRes, activityRes, profilesRes] = await Promise.all([
    supabase
      .from("documents")
      .select("id, file_name, file_size, created_at, uploaded_by, description, md_storage_path, screening_documents(screening_id)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("screenings")
      .select("id, schema_template_id, status, created_at, started_at, ended_at, template:schema_templates(name), assessment:screening_assessments(status, recommendation)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("project_activity").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("profiles").select("id, full_name, email"),
  ])
  for (const res of [documentsRes, screeningsRes, activityRes, profilesRes]) if (res.error) throw res.error

  const nameOf = (userId: string | null | undefined) => {
    const p = profilesRes.data!.find((x) => x.id === userId)
    return p?.full_name || p?.email || "Someone"
  }

  // Scores: reviewed score where there is one, otherwise the AI proposal; gaps excluded.
  const screeningIds = screeningsRes.data!.map((s) => s.id)
  const [resultsRes, reviewsRes] = await Promise.all([
    supabase
      .from("screening_field_results")
      .select("screening_id, schema_field_id, ai_score, is_gap")
      .in("screening_id", screeningIds),
    supabase.from("field_reviews").select("screening_id, schema_field_id, status, score").in("screening_id", screeningIds),
  ])
  if (resultsRes.error) throw resultsRes.error
  if (reviewsRes.error) throw reviewsRes.error
  const fieldIds = [...new Set(resultsRes.data.map((r) => r.schema_field_id!))]
  const { data: fields, error: fieldsError } = await supabase.from("schema_field").select("id, weight").in("id", fieldIds)
  if (fieldsError) throw fieldsError
  const weightOf = new Map(fields.map((f) => [f.id, Number(f.weight ?? 0.5)]))

  const screenings: ProjectScreeningItem[] = screeningsRes.data!.map((s) => {
    const cells = resultsRes.data.filter((r) => r.screening_id === s.id)
    const reviews = reviewsRes.data.filter((r) => r.screening_id === s.id)
    let weighted = 0
    let totalWeight = 0
    for (const cell of cells) {
      const review = reviews.find((r) => r.schema_field_id === cell.schema_field_id)
      const score = review ? review.score : cell.is_gap ? null : cell.ai_score
      if (score == null) continue
      const weight = weightOf.get(cell.schema_field_id!) ?? 0.5
      weighted += weight * normalizeScore(score)
      totalWeight += weight
    }
    const assessment = s.assessment?.status === "final" ? s.assessment : null
    return {
      id: String(s.id),
      templateId: s.schema_template_id != null ? String(s.schema_template_id) : null,
      template: s.template?.name ?? "Untitled template",
      status: SCREENING_STATUS[s.status],
      score: totalWeight > 0 ? weighted / totalWeight : null,
      reviewed: reviews.filter((r) => r.status !== "follow_up").length,
      total: cells.length,
      recommendation: assessment?.recommendation ?? null,
      screenedAt: formatTimestamp(s.ended_at ?? s.started_at ?? s.created_at),
    }
  })

  const activity: ProjectActivityItem[] = activityRes.data!.map((a) => {
    const type = a.type as ProjectActivityItem["type"]
    const message =
      type === "created"
        ? "created the project"
        : type === "upload"
          ? `uploaded ${a.subject}`
          : type === "screening"
            ? `started a screening with ${a.subject ?? "a template"}`
            : type === "assessment"
              ? `finalised the assessment — ${RECOMMENDATION_TEXT[a.subject as Recommendation] ?? a.subject}`
              : "commented"
    return {
      id: a.id!,
      type,
      actor: nameOf(a.actor),
      actorId: a.actor,
      message,
      body: a.body ?? undefined,
      timestamp: formatTimestamp(a.created_at),
    }
  })

  const userId = claims?.claims.sub ?? ""
  return {
    id: project.id,
    orgId: project.org_id,
    name: project.name ?? "Untitled project",
    status: statusLabel(project.status),
    createdAt: formatTimestamp(project.created_at),
    documents: documentsRes.data!.map((d) => ({
      id: String(d.id),
      name: d.file_name,
      size: formatSize(d.file_size),
      uploadedAt: formatTimestamp(d.created_at),
      uploadedBy: d.uploaded_by ? nameOf(d.uploaded_by) : undefined,
      description: d.description ?? undefined,
      hasMarkdown: !!d.md_storage_path,
      usedInScreenings: d.screening_documents.length,
    })),
    screenings,
    activity,
    currentUser: { id: userId, name: nameOf(userId) },
  }
}
