"use client"

import { useReducer, useState, type KeyboardEvent } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { IconArrowDown, IconArrowUp, IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  finalScore,
  isDealbreaker,
  scopeScore,
  type CellEvent,
  type CellFacts,
  type CellReview,
  type ProspectAssessment,
  type SourceRef,
  type Score,
  type TemplateField,
  type TemplateScreening,
  type TemplateScreenings,
} from "@/features/screenings"
import { cn } from "@/lib/utils"
import { uploadDocuments } from "@/features/projects/upload"
import { addEvidence, reopenFieldReview, saveAssessment, saveFieldReview, setFactValue } from "../actions"
import { buildCase, progressOf, sourcesOf } from "../assessment"
import { cellKey, nowLabel, reviewReducer } from "../review-state"
import type { CompareProject, DataRoomDocument, SortKey, SortState, ViewerTarget } from "../types"
import type { Citation } from "./document-viewer"
import { AssessmentPanel } from "./assessment-panel"
import { updateCategory } from "@/features/templates/actions"
import { CreateCategorySheet } from "@/features/templates/components/create-category-sheet"
import { CategoryMenu, categorySortKey } from "./category-menu"
import { ColumnMenu } from "./column-menu"
import { CriterionDetailsSheet } from "./criterion-details-sheet"
import { EditCriterionSheet } from "./edit-criterion-sheet"
import { FieldCell } from "./field-cell"
import { ReviewPanel } from "./review-panel"
import { RecommendationTag, ScoreMeter } from "./score-chip"
import { ScopePicker } from "./scope-picker"

// pdf.js needs the browser — load the viewer only on the client, and only when opened.
const DocumentViewer = dynamic(() => import("./document-viewer").then((m) => m.DocumentViewer), { ssr: false })

const COL_PROJECT = 248
const COL_SCORE = 88
const COL_FIELD = 168
const COL_SUMMARY = 120

type Panel = { kind: "criterion"; screeningId: string; fieldId: string } | { kind: "assessment"; screeningId: string }

interface Cell {
  screening: TemplateScreening
  field: TemplateField
}

interface ComparisonGridProps {
  templates: { id: string; name: string }[]
  data: TemplateScreenings
  projects: Record<string, CompareProject>
  currentUser: string
  initialReviews: Record<string, Record<string, CellReview>>
  initialEvents: Record<string, CellEvent[]>
  initialAddedSources: Record<string, Record<string, SourceRef[]>>
  initialAssessments: Record<string, ProspectAssessment>
  initialFacts: Record<string, CellFacts>
}

export function ComparisonGrid({
  templates,
  data,
  projects,
  currentUser,
  initialReviews,
  initialEvents,
  initialAddedSources,
  initialAssessments,
  initialFacts,
}: ComparisonGridProps) {
  const router = useRouter()

  const allFields = data.categories.flatMap((c) => c.fields)
  const categoryOf = Object.fromEntries(data.categories.flatMap((c) => c.fields.map((f) => [f.id, c.name])))

  const [state, dispatch] = useReducer(reviewReducer, {
    reviews: initialReviews,
    events: {},
    assessments: initialAssessments,
    uploads: {},
    addedSources: initialAddedSources,
    facts: initialFacts,
    seq: 0,
  })
  const [scope, setScope] = useState<Set<string>>(() => new Set(allFields.map((f) => f.id)))
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState>({ key: "scope", dir: "desc" })
  const [panel, setPanel] = useState<Panel | null>(null)
  const [viewer, setViewer] = useState<ViewerTarget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailsFieldId, setDetailsFieldId] = useState<string | null>(null)
  const [editFieldId, setEditFieldId] = useState<string | null>(null)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  // Collapsed categories show only their summary column; their criteria still count.
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  // Local state is updated optimistically; if the database rejects a write we say so
  // and re-read the server's truth.
  async function persist(write: Promise<{ ok: boolean; error?: string }>) {
    const result = await write
    if (!result.ok) {
      setError(result.error ?? "Could not save")
      router.refresh()
    }
    return result.ok
  }

  const reviewOf = (screeningId: string, fieldId: string) => state.reviews[screeningId]?.[fieldId]

  // ── Data room & evidence ──

  const documentsOf = (projectId: string): DataRoomDocument[] => [
    ...(projects[projectId]?.documents ?? []),
    ...(state.uploads[projectId] ?? []),
  ]

  function citationsOf(screening: TemplateScreening): Citation[] {
    return allFields.flatMap((field) =>
      sourcesOf(screening, field.id, state.addedSources[screening.id]).map((source) => ({
        fieldId: field.id,
        fieldName: field.name,
        source,
      }))
    )
  }

  function citedByOf(screening: TemplateScreening): Record<string, number> {
    const fieldsByDoc = new Map<string, Set<string>>()
    for (const c of citationsOf(screening)) {
      fieldsByDoc.set(c.source.documentName, (fieldsByDoc.get(c.source.documentName) ?? new Set()).add(c.fieldId))
    }
    return Object.fromEntries([...fieldsByDoc].map(([doc, fields]) => [doc, fields.size]))
  }

  async function upload(projectId: string, files: File[]) {
    const project = projects[projectId]
    if (!project) return
    const { uploaded, errors } = await uploadDocuments(project, files)
    if (uploaded.length) dispatch({ type: "upload", projectId, documents: uploaded })
    if (errors.length) setError(errors.join(" · "))
  }



  // ── Derived view ──

  const categoriesInScope = data.categories
    .map((c) => ({ ...c, fields: c.fields.filter((f) => scope.has(f.id)) }))
    .filter((c) => c.fields.length > 0)
  const fieldsInScope = categoriesInScope.flatMap((c) => c.fields)
  const shownFields = (c: { id: string; fields: TemplateField[] }) => (collapsedCategories.has(c.id) ? [] : c.fields)
  const visibleFields = categoriesInScope.flatMap(shownFields)

  const rows = (() => {
    const q = query.trim().toLowerCase()
    const withScore = data.screenings
      .filter((s) => !q || s.project.toLowerCase().includes(q))
      .map((s) => ({ screening: s, score: scopeScore(s, fieldsInScope, state.reviews[s.id]) }))

    const value = (row: (typeof withScore)[number]): number | string | null => {
      if (sort.key === "project") return row.screening.project
      if (sort.key === "scope") return row.score
      if (sort.key.startsWith("cat:")) {
        const category = categoriesInScope.find((c) => `cat:${c.id}` === sort.key)
        return category ? scopeScore(row.screening, category.fields, state.reviews[row.screening.id]) : null
      }
      if (sort.key.startsWith("fact:")) {
        // fact:<fieldId>:<propertyKey> — the reviewer's value wins over the AI's.
        const [, fieldId, key] = sort.key.split(":")
        const entry = state.facts[row.screening.id]?.[fieldId!]?.[key!]
        const value = entry?.reviewer?.value ?? entry?.ai
        return typeof value === "number" || typeof value === "string" ? value : null
      }
      return finalScore(row.screening.results[sort.key], reviewOf(row.screening.id, sort.key))
    }

    return withScore.sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      if (va === null) return vb === null ? 0 : 1
      if (vb === null) return -1
      const cmp = typeof va === "string" ? va.localeCompare(String(vb)) : va - (vb as number)
      return sort.dir === "asc" ? cmp : -cmp
    })
  })()

  // Reading order of the cells on screen — drives prev/next and "save and next".
  const visibleCells: Cell[] = rows.flatMap(({ screening }) =>
    visibleFields.map((field) => ({ screening, field }))
  )

  const overall = visibleCells.reduce(
    (acc, { screening, field }) => {
      acc.total++
      const review = reviewOf(screening.id, field.id)
      if (review && review.status !== "follow_up") acc.reviewed++
      return acc
    },
    { total: 0, reviewed: 0 }
  )

  // ── Selection & navigation ──

  const selectedIndex =
    panel?.kind === "criterion"
      ? visibleCells.findIndex((c) => c.screening.id === panel.screeningId && c.field.id === panel.fieldId)
      : -1
  const selectedCell = selectedIndex >= 0 ? visibleCells[selectedIndex] : undefined

  function openCell(cell: Cell | undefined, opts: { focus?: boolean } = {}) {
    if (!cell) return
    setPanel({ kind: "criterion", screeningId: cell.screening.id, fieldId: cell.field.id })
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-cell="${cellKey(cell.screening.id, cell.field.id)}"]`)
      if (opts.focus) el?.focus()
      else el?.scrollIntoView({ block: "nearest", inline: "nearest" })
    })
  }

  function onGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      setPanel(null)
      return
    }
    if (!selectedCell || !e.key.startsWith("Arrow")) return
    e.preventDefault()
    const r = rows.findIndex((row) => row.screening.id === selectedCell.screening.id) +
      (e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0)
    const c = visibleFields.findIndex((f) => f.id === selectedCell.field.id) +
      (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0)
    const screening = rows[r]?.screening
    const field = visibleFields[c]
    if (screening && field) openCell({ screening, field }, { focus: true })
  }

  function eventsFor({ screening, field }: Cell): CellEvent[] {
    const result = screening.results[field.id]
    const key = cellKey(screening.id, field.id)
    return [
      ...(result
        ? [{ id: "ai", type: "ai_assessed" as const, actor: "Riskbase AI", at: screening.screenedAt, toScore: result.score }]
        : []),
      ...(initialEvents[key] ?? []),
      ...(state.events[key] ?? []),
    ]
  }


  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "project" ? "asc" : "desc" }
    )
  }

  const leftWidth = COL_PROJECT + COL_SCORE
  const assessmentScreening =
    panel?.kind === "assessment" ? data.screenings.find((s) => s.id === panel.screeningId) : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Header ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background px-8 py-4">
        <div className="mr-auto flex flex-col gap-0.5">
          <h1 className="text-base font-semibold">Compare</h1>
          <span className="text-xs text-muted-foreground">
            {overall.reviewed} of {overall.total} assessments reviewed
          </span>
        </div>

        <Select
          items={templates.map((t) => ({ value: t.id, label: t.name }))}
          value={data.id}
          onValueChange={(v: string | null) => {
            if (v && v !== data.id) router.push(`/compare?template=${encodeURIComponent(v)}`)
          }}
        >
          <SelectTrigger size="sm" className="w-44" aria-label="Template">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ScopePicker categories={data.categories} selected={scope} onChange={setScope} />

        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find prospect"
            aria-label="Find prospect"
            className="h-7 w-44 pl-8 text-sm"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 border-b border-border bg-score-n2-bg px-8 py-2 text-xs text-score-n2">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {fieldsInScope.length === 0 ? (
          <EmptyMessage>No criteria in scope. Choose what to compare under Scope.</EmptyMessage>
        ) : rows.length === 0 ? (
          <EmptyMessage>No prospects match “{query}”.</EmptyMessage>
        ) : (
          <div className="min-w-0 flex-1 overflow-auto" onKeyDown={onGridKeyDown}>
            <table
              className="border-separate border-spacing-0 text-left"
              style={{ minWidth: leftWidth + visibleFields.length * COL_FIELD + categoriesInScope.length * COL_SUMMARY }}
            >
              <thead className="sticky top-0 z-30">
                <tr>
                  <th colSpan={2} className="sticky left-0 z-40 border-b border-border bg-muted" style={{ width: leftWidth }} />
                  {categoriesInScope.map((cat) => (
                    <th
                      key={cat.id}
                      colSpan={shownFields(cat).length + 1}
                      className="border-b border-l border-border bg-muted px-3 py-2 text-xs whitespace-nowrap text-foreground/80"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-semibold">{cat.name}</span>
                        {cat.weight !== undefined && (
                          <span className="font-normal tabular-nums text-muted-foreground">×{cat.weight.toFixed(2)}</span>
                        )}
                        <CategoryMenu
                          category={cat}
                          sort={sort}
                          collapsed={collapsedCategories.has(cat.id)}
                          onSort={(dir) => setSort({ key: categorySortKey(cat.id), dir })}
                          onToggleCollapsed={() =>
                            setCollapsedCategories((prev) => {
                              const next = new Set(prev)
                              if (next.has(cat.id)) next.delete(cat.id)
                              else next.add(cat.id)
                              return next
                            })
                          }
                          onShowOnly={() => setScope(new Set(cat.fields.map((f) => f.id)))}
                          onHide={() =>
                            setScope((prev) => {
                              const next = new Set(prev)
                              cat.fields.forEach((f) => next.delete(f.id))
                              return next
                            })
                          }
                          onEdit={() => setEditCategoryId(cat.id)}
                        />
                      </span>
                    </th>
                  ))}
                </tr>
                <tr>
                  <th
                    className="sticky left-0 z-40 border-b border-border bg-card px-4 py-2.5 align-bottom"
                    style={{ width: COL_PROJECT, minWidth: COL_PROJECT }}
                  >
                    <SortButton active={sort.key === "project"} dir={sort.dir} onClick={() => toggleSort("project")}>
                      Prospect
                    </SortButton>
                  </th>
                  <th
                    className="sticky z-40 border-r border-b border-border bg-card px-3 py-2.5 align-bottom"
                    style={{ left: COL_PROJECT, width: COL_SCORE, minWidth: COL_SCORE }}
                  >
                    <SortButton
                      active={sort.key === "scope"}
                      dir={sort.dir}
                      onClick={() => toggleSort("scope")}
                      title="Weighted 0–1 score across the criteria in scope. Reviewed scores replace AI proposals."
                    >
                      Score
                    </SortButton>
                  </th>
                  {categoriesInScope.flatMap((category) => [
                    <th
                      key={`summary-${category.id}`}
                      className="border-b border-l border-border bg-muted px-3 py-2.5 align-bottom"
                      style={{ width: COL_SUMMARY, minWidth: COL_SUMMARY }}
                      aria-label={`${category.name} summary`}
                    >
                      {sort.key === categorySortKey(category.id) &&
                        (sort.dir === "asc" ? (
                          <IconArrowUp className="size-3 text-foreground" aria-label="Sorted lowest first" />
                        ) : (
                          <IconArrowDown className="size-3 text-foreground" aria-label="Sorted highest first" />
                        ))}
                    </th>,
                    ...shownFields(category).map((field) => (
                      <th
                        key={field.id}
                        className="border-b border-border bg-card px-3 py-2.5 align-bottom"
                        style={{ width: COL_FIELD, minWidth: COL_FIELD }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <SortButton
                            active={sort.key === field.id || sort.key.startsWith(`fact:${field.id}:`)}
                            dir={sort.dir}
                            onClick={() => toggleSort(field.id)}
                            title={field.extractionPrompt || field.name}
                          >
                            <span className="line-clamp-2 text-left">{field.name}</span>
                          </SortButton>
                          <ColumnMenu
                            field={field}
                            sort={sort}
                            onSort={(key, dir) => setSort({ key, dir })}
                            onDetails={() => setDetailsFieldId(field.id)}
                            onEdit={() => setEditFieldId(field.id)}
                            onHide={() =>
                              setScope((prev) => {
                                const next = new Set(prev)
                                next.delete(field.id)
                                return next
                              })
                            }
                          />
                        </div>
                      </th>
                    )),
                  ])}
                </tr>
              </thead>

              <tbody>
                {rows.map(({ screening, score }) => {
                  const progress = progressOf(screening, allFields, state.reviews[screening.id])
                  const assessment = state.assessments[screening.id]
                  const assessmentOpen = panel?.kind === "assessment" && panel.screeningId === screening.id

                  return (
                    <tr key={screening.id} className="group/row">
                      <td
                        className="sticky left-0 z-20 border-b border-border bg-card p-0 align-top group-hover/row:bg-accent"
                        style={{ width: COL_PROJECT, minWidth: COL_PROJECT }}
                      >
                        <button
                          type="button"
                          onClick={() => setPanel({ kind: "assessment", screeningId: screening.id })}
                          className={cn(
                            "flex size-full flex-col gap-1.5 px-4 py-2.5 text-left",
                            assessmentOpen && "bg-accent shadow-[inset_2px_0_0_var(--primary)]"
                          )}
                        >
                          <span className="truncate text-sm font-semibold text-foreground">{screening.project}</span>
                          {assessment?.status === "final" && assessment.recommendation ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <RecommendationTag value={assessment.recommendation} />
                              Assessed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {progress.reviewed}/{progress.total} reviewed
                              {assessment && " · draft"}
                            </span>
                          )}
                        </button>
                      </td>

                      <td
                        className="sticky z-20 border-r border-b border-border bg-card px-3 py-2.5 align-top group-hover/row:bg-accent"
                        style={{ left: COL_PROJECT, width: COL_SCORE, minWidth: COL_SCORE }}
                      >
                        <div className="flex flex-col gap-1.5 pt-0.5">
                          <span className="text-sm font-semibold tabular-nums">{score === null ? "—" : score.toFixed(2)}</span>
                          <ScoreMeter value={score} />
                        </div>
                      </td>

                      {categoriesInScope.flatMap((category) => [
                        <td
                          key={`summary-${category.id}`}
                          className="border-b border-l border-border bg-muted px-3 py-2.5 align-top"
                          style={{ width: COL_SUMMARY, minWidth: COL_SUMMARY }}
                        >
                          <CategorySummary
                            screening={screening}
                            fields={category.fields}
                            reviews={state.reviews[screening.id] ?? {}}
                          />
                        </td>,
                        ...shownFields(category).map((field) => (
                          <td
                            key={field.id}
                            // h-px lets the cell's content stretch to the full row height.
                            className="h-px border-b border-border bg-background p-0 align-top group-hover/row:bg-accent/40"
                            style={{ width: COL_FIELD, minWidth: COL_FIELD }}
                          >
                            <FieldCell
                              cellId={cellKey(screening.id, field.id)}
                              field={field}
                              result={screening.results[field.id]}
                              review={reviewOf(screening.id, field.id)}
                              selected={panel?.kind === "criterion" && panel.screeningId === screening.id && panel.fieldId === field.id}
                              onSelect={() => openCell({ screening, field })}
                            />
                          </td>
                        )),
                      ])}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedCell && (
          <ReviewPanel
            projectId={selectedCell.screening.projectId}
            projectName={selectedCell.screening.project}
            screeningId={selectedCell.screening.id}
            categoryName={categoryOf[selectedCell.field.id] ?? ""}
            field={selectedCell.field}
            result={selectedCell.screening.results[selectedCell.field.id]}
            review={reviewOf(selectedCell.screening.id, selectedCell.field.id)}
            events={eventsFor(selectedCell)}
            sources={sourcesOf(selectedCell.screening, selectedCell.field.id, state.addedSources[selectedCell.screening.id])}
            onOpenSource={(source) =>
              setViewer({
                projectId: selectedCell.screening.projectId,
                screeningId: selectedCell.screening.id,
                documentName: source.documentName,
                focus: { page: source.page ?? 1, quote: source.quote },
              })
            }
            facts={state.facts[selectedCell.screening.id]?.[selectedCell.field.id] ?? {}}
            onSetFact={(key, value) => {
              const ids = { screeningId: selectedCell.screening.id, fieldId: selectedCell.field.id }
              dispatch({ type: "set_fact", ...ids, key, value, by: currentUser, at: nowLabel() })
              void persist(setFactValue({ ...ids, key, value }))
            }}
            position={{ index: selectedIndex, total: visibleCells.length }}
            onReview={(status, reviewScore: Score, rationale, advance) => {
              const { screening, field } = selectedCell
              const result = screening.results[field.id]
              dispatch({
                type: "review",
                screeningId: screening.id,
                fieldId: field.id,
                aiScore: result?.score ?? reviewScore,
                review: { status, score: reviewScore, rationale, reviewer: currentUser, reviewedAt: nowLabel() },
              })
              void persist(
                saveFieldReview({
                  screeningId: screening.id,
                  fieldId: field.id,
                  status,
                  score: reviewScore,
                  aiScore: result && !result.isGap ? result.score : null,
                  rationale,
                })
              )
              if (advance) {
                // `state` is still pre-dispatch here, so skip the current cell explicitly.
                const unreviewed = (c: Cell, i: number) =>
                  i !== selectedIndex && !!c.screening.results[c.field.id] && !reviewOf(c.screening.id, c.field.id)
                const next =
                  visibleCells.find((c, i) => i > selectedIndex && unreviewed(c, i)) ?? visibleCells.find(unreviewed)
                if (next) openCell(next)
              }
            }}
            onReopen={() => {
              const ids = { screeningId: selectedCell.screening.id, fieldId: selectedCell.field.id }
              dispatch({ type: "reopen", ...ids, actor: currentUser, at: nowLabel() })
              void persist(reopenFieldReview(ids))
            }}
            onNavigate={(dir) => openCell(visibleCells[selectedIndex + dir])}
            onClose={() => setPanel(null)}
          />
        )}

        {assessmentScreening && projects[assessmentScreening.projectId] && (
          <AssessmentPanel
            project={{ ...projects[assessmentScreening.projectId]!, documents: documentsOf(assessmentScreening.projectId) }}
            templateName={data.name}
            caseFile={buildCase(
              assessmentScreening,
              data.categories,
              state.reviews[assessmentScreening.id],
              state.addedSources[assessmentScreening.id]
            )}
            citedBy={citedByOf(assessmentScreening)}
            onUpload={(files) => upload(assessmentScreening.projectId, files)}
            onOpenDocument={(documentName, focus) =>
              setViewer({
                projectId: assessmentScreening.projectId,
                screeningId: assessmentScreening.id,
                documentName,
                focus,
              })
            }
            score={scopeScore(assessmentScreening, allFields, state.reviews[assessmentScreening.id])}
            assessment={state.assessments[assessmentScreening.id]}
            onSave={async (draft) => {
              // Not optimistic: the database decides whether an assessment may be finalised.
              const saved = await persist(saveAssessment({ screeningId: assessmentScreening.id, ...draft }))
              if (saved) {
                setError(null)
                dispatch({
                  type: "save_assessment",
                  screeningId: assessmentScreening.id,
                  assessment: { ...draft, author: currentUser, updatedAt: nowLabel() },
                })
              }
            }}
            onOpenCriterion={(field) => openCell({ screening: assessmentScreening, field })}
            onClose={() => setPanel(null)}
          />
        )}
      </div>

      <CriterionDetailsSheet
        field={allFields.find((f) => f.id === detailsFieldId) ?? null}
        categoryName={detailsFieldId ? (categoryOf[detailsFieldId] ?? "") : ""}
        screenings={rows.map((r) => r.screening)}
        reviews={state.reviews}
        facts={state.facts}
        onOpenCell={(screening) => {
          const field = allFields.find((f) => f.id === detailsFieldId)
          setDetailsFieldId(null)
          if (field) openCell({ screening, field })
        }}
        onClose={() => setDetailsFieldId(null)}
      />

      {(() => {
        const category = data.categories.find((c) => c.id === editCategoryId)
        return (
          <CreateCategorySheet
            key={`${editCategoryId ?? "none"}`}
            open={!!category}
            onOpenChange={(open) => !open && setEditCategoryId(null)}
            initialData={
              category
                ? {
                    id: category.id,
                    name: category.name,
                    weight: Math.round((category.weight ?? 0.5) * 100),
                    description: category.description ?? "",
                  }
                : undefined
            }
            onSave={async (form) => {
              if (!form.id) return
              const saved = await persist(
                updateCategory(data.id, form.id, { name: form.name, weight: form.weight / 100, description: form.description })
              )
              if (saved) router.refresh()
            }}
          />
        )
      })()}

      <EditCriterionSheet
        templateId={data.id}
        templateName={data.name}
        screeningCount={data.screenings.length}
        field={allFields.find((f) => f.id === editFieldId) ?? null}
        onClose={() => setEditFieldId(null)}
      />

      {viewer && (() => {
        const screening = data.screenings.find((sc) => sc.id === viewer.screeningId)
        if (!screening) return null
        return (
          <DocumentViewer
            key={`${viewer.projectId}:${viewer.documentName}:${viewer.focus?.page ?? ""}:${viewer.focus?.quote ?? ""}`}
            documents={documentsOf(viewer.projectId)}
            documentName={viewer.documentName}
            focus={viewer.focus}
            citations={citationsOf(screening)}
            fields={allFields}
            onSelectDocument={(documentName) => setViewer({ ...viewer, documentName, focus: undefined })}
            onCite={(fieldId, source) => {
              const doc = documentsOf(viewer.projectId).find((d) => d.name === source.documentName)
              if (!doc) return
              dispatch({
                type: "add_source",
                screeningId: screening.id,
                fieldId,
                source: { ...source, documentId: doc.id, addedBy: currentUser, addedAt: nowLabel() },
              })
              void persist(
                addEvidence({
                  screeningId: screening.id,
                  fieldId,
                  documentId: doc.id,
                  page: source.page ?? 1,
                  quote: source.quote,
                })
              )
            }}
            onClose={() => setViewer(null)}
          />
        )
      })()}
    </div>
  )
}

// ─── Bits ────────────────────────────────────────────────────────────────────

/** A prospect's result for one category: weighted score, meter and review status. */
function CategorySummary({
  screening,
  fields,
  reviews,
}: {
  screening: TemplateScreening
  fields: TemplateField[]
  reviews: Record<string, CellReview>
}) {
  const score = scopeScore(screening, fields, reviews)
  const assessed = fields.filter((f) => screening.results[f.id] || reviews[f.id])
  const reviewed = assessed.filter((f) => reviews[f.id] && reviews[f.id]!.status !== "follow_up").length
  const dealbreakers = assessed.filter((f) => isDealbreaker(f, screening.results[f.id], reviews[f.id])).length
  const gaps = assessed.filter((f) => (reviews[f.id] ? reviews[f.id]!.status === "follow_up" : screening.results[f.id]?.isGap)).length

  return (
    <div className="flex flex-col gap-1.5 pt-0.5">
      <span className="text-sm font-semibold tabular-nums">{score === null ? "—" : score.toFixed(2)}</span>
      <ScoreMeter value={score} />
      <span className="text-[11px] leading-snug text-muted-foreground">
        {reviewed}/{assessed.length} reviewed
        {dealbreakers > 0 && <span className="text-destructive"> · {dealbreakers} DB</span>}
        {gaps > 0 && <span className="text-indicator-gap"> · {gaps} gap{gaps === 1 ? "" : "s"}</span>}
      </span>
    </div>
  )
}

function SortButton({
  active,
  dir,
  onClick,
  title,
  children,
}: {
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  const Icon = dir === "asc" ? IconArrowUp : IconArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-start gap-1 text-xs font-medium text-foreground/80 hover:text-foreground",
        active && "text-foreground"
      )}
    >
      {children}
      {active && <Icon className="mt-px size-3 shrink-0" />}
    </button>
  )
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-12 text-sm text-muted-foreground">{children}</div>
}
