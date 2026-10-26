"use client"

import { useState, useMemo, use } from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconPencil,
  IconCheck,
  IconX,
  IconRefresh,
  IconChevronDown,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Score = -2 | -1 | 0 | 1 | 2
type ScreeningStatus = "Completed" | "In progress" | "Review" | "Draft"

interface FieldResult {
  id: string
  name: string
  weight: number
  isDealbreakerField: boolean
  gapInstruction: string
  aiScore: Score
  aiExtractedContent: string
  aiIsGap: boolean
}

interface Category {
  id: string
  name: string
  fields: FieldResult[]
}

interface ScreeningDetail {
  id: string
  project: string
  template: string
  status: ScreeningStatus
  screenedAt: string
  document: string
  categories: Category[]
}

interface FieldOverride {
  score: Score
  extractedContent: string
  isGap: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK: ScreeningDetail = {
  id: "1",
  project: "Strommen 3A",
  template: "Miljø Screener",
  status: "Review",
  screenedAt: "2 Jun 2026",
  document: "Strommen_3A_miljorapport.pdf",
  categories: [
    {
      id: "cat-1",
      name: "Geoteknik",
      fields: [
        { id: "f-1", name: "Jordforurening", weight: 0.30, isDealbreakerField: true, gapInstruction: "Beskriv forureningsstatus for det øvre jordlag inkl. analyseresultater.", aiScore: -2, aiExtractedContent: "Rapporten fra 2019 viser forhøjede værdier af PAH og tungmetaller i det øvre jordlag (0–0,5 m). Koncentrationen overskrider Miljøstyrelsens klasse 4-grænser i samtlige af de 12 prøvepunkter.", aiIsGap: false },
        { id: "f-2", name: "Grundforhold", weight: 0.20, isDealbreakerField: false, gapInstruction: "Beskriv grundforhold og bæreevne iht. geoteknisk rapport.", aiScore: 1, aiExtractedContent: "Geoteknisk rapport viser bæredygtige lermasser ned til ca. 12 m. Sætninger forventes inden for acceptable grænser iht. DS/EN 1997-1. Grundvandsstand registreret på 4,5 m.", aiIsGap: false },
        { id: "f-3", name: "Sætningsrisiko", weight: 0.15, isDealbreakerField: false, gapInstruction: "Angiv beregnet total- og differenssætning.", aiScore: 0, aiExtractedContent: "Beregnet totalsætning er estimeret til 25–40 mm. Differenssætning anses som lav risiko ved jævn fundering.", aiIsGap: false },
      ],
    },
    {
      id: "cat-2",
      name: "Miljøpåvirkning",
      fields: [
        { id: "f-4", name: "Støj og vibrationer", weight: 0.10, isDealbreakerField: false, gapInstruction: "Referér støjredegørelse med grænseværdier for naboer.", aiScore: 1, aiExtractedContent: "Støjredegørelsen viser, at tiltaget overholder Miljøstyrelsens vejledende grænseværdier for alle naboejendomme.", aiIsGap: false },
        { id: "f-5", name: "Støvhåndtering", weight: 0.10, isDealbreakerField: false, gapInstruction: "Beskriv støvreducerende tiltag i byggefasen, inkl. vanding og afskærmningstiltag.", aiScore: -1, aiExtractedContent: "", aiIsGap: true },
        { id: "f-6", name: "Affaldshåndtering", weight: 0.05, isDealbreakerField: false, gapInstruction: "Beskriv affaldsplan inkl. sorteringskrav og mængdeberegning.", aiScore: 0, aiExtractedContent: "Affaldsplanen er delvist udarbejdet. Sorteringskrav iht. SHA-planen er beskrevet, men mængdeberegning mangler.", aiIsGap: true },
      ],
    },
    {
      id: "cat-3",
      name: "Regulatorisk",
      fields: [
        { id: "f-7", name: "Lokalplan", weight: 0.05, isDealbreakerField: false, gapInstruction: "Angiv gældende planformål og eventuelt dispensationsbehov.", aiScore: -1, aiExtractedContent: "Den gældende lokalplan er fra 1997 og er under revision. Dispensation fra bebyggelsesprocenten vil sandsynligvis være nødvendig.", aiIsGap: false },
        { id: "f-8", name: "Kulturminder", weight: 0.05, isDealbreakerField: true, gapInstruction: "Beskriv fund fra kulturmindesøgning og evt. krav fra Slots- og Kulturstyrelsen.", aiScore: -2, aiExtractedContent: "Slots- og Kulturstyrelsen har i brev af 18. maj 2026 markeret området som potentielt arkæologisk interessant. Fredede fortidsminder kan ikke udelukkes uden en arkæologisk forundersøgelse.", aiIsGap: false },
      ],
    },
  ],
}

// ─── Score config ─────────────────────────────────────────────────────────────

interface ScoreConf {
  dot: string
  segActive: string
  label: string
}

// Traffic-light gradient, matching the risk-level colors used on the screenings list (Low → Critical).
const SCORE_CONF: Record<number, ScoreConf> = {
  "-2": { dot: "bg-destructive", segActive: "bg-destructive/15 text-destructive", label: "-2" },
  "-1": { dot: "bg-severe", segActive: "bg-severe/15 text-orange-600 dark:text-orange-400", label: "-1" },
   "0": { dot: "bg-warning", segActive: "bg-warning/15 text-amber-600 dark:text-amber-400", label: "0" },
   "1": { dot: "bg-success", segActive: "bg-success/15 text-emerald-600 dark:text-emerald-400", label: "+1" },
   "2": { dot: "bg-emerald-600", segActive: "bg-success/20 text-emerald-700 dark:text-emerald-400", label: "+2" },
}

const STATUS_DOT: Record<ScreeningStatus, string> = {
  Completed: "bg-primary",
  "In progress": "bg-warning",
  Review: "bg-warning",
  Draft: "bg-muted-foreground",
}

function normalizeScore(s: number) { return (s + 2) / 4 }

function computeMaut(fields: Array<{ weight: number; score: number }>) {
  const total = fields.reduce((a, f) => a + f.weight, 0)
  return total === 0 ? 0 : fields.reduce((a, f) => a + f.weight * normalizeScore(f.score), 0) / total
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreDot({ score }: { score: Score }) {
  return <span className={cn("mt-1.5 size-2.5 rounded-full shrink-0", SCORE_CONF[score].dot)} />
}

const SCORE_STEPS: Score[] = [-2, -1, 0, 1, 2]

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  isEditMode,
  savedOverride,
  draftOverride,
  onDraftChange,
  onReset,
}: {
  field: FieldResult
  isEditMode: boolean
  savedOverride?: FieldOverride
  draftOverride?: FieldOverride
  onDraftChange: (p: Partial<FieldOverride>) => void
  onReset: () => void
}) {
  const active = isEditMode ? draftOverride : savedOverride

  const score: Score = active?.score ?? field.aiScore
  const content: string = active?.extractedContent ?? field.aiExtractedContent
  const isGap: boolean = active?.isGap ?? field.aiIsGap

  const isDealbreaker = field.isDealbreakerField && score === -2

  const isOverridden =
    !!savedOverride &&
    (savedOverride.score !== field.aiScore ||
      savedOverride.extractedContent !== field.aiExtractedContent ||
      savedOverride.isGap !== field.aiIsGap)

  const isEdited =
    isEditMode &&
    !!draftOverride &&
    (draftOverride.score !== (savedOverride?.score ?? field.aiScore) ||
      draftOverride.extractedContent !== (savedOverride?.extractedContent ?? field.aiExtractedContent) ||
      draftOverride.isGap !== (savedOverride?.isGap ?? field.aiIsGap))

  // ── Edit mode ──
  if (isEditMode) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2.5 px-5 py-3 border-b border-border last:border-0 transition-colors",
          isEdited && "bg-muted/10 border-l-2 border-l-primary/40"
        )}
      >
        {/* Field name + weight + inline score picker */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium flex-1 truncate">{field.name}</span>
          <span className="text-xs text-muted-foreground font-mono shrink-0">×{field.weight.toFixed(2)}</span>
          <div className="flex gap-0.5 shrink-0">
            {SCORE_STEPS.map((s) => {
              const c = SCORE_CONF[s]
              const isActive = score === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onDraftChange({ score: s })}
                  className={cn(
                    "h-6 px-2 text-xs font-semibold rounded transition-colors",
                    isActive ? c.segActive : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          {isEdited && (
            <button
              type="button"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Reset to AI"
            >
              <IconRefresh className="size-3.5" />
            </button>
          )}
        </div>

        {/* Extracted content */}
        <textarea
          value={content}
          onChange={(e) => onDraftChange({ extractedContent: e.target.value })}
          rows={3}
          placeholder={isGap ? "No content extracted" : ""}
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
        />

        {/* Gap toggle */}
        <label className="flex items-start gap-2 cursor-pointer w-fit">
          <Switch size="sm" checked={isGap} onCheckedChange={(v) => onDraftChange({ isGap: v })} className="mt-px" />
          <span className={cn("text-xs leading-snug", isGap ? "text-muted-foreground/70 italic" : "text-muted-foreground")}>
            {isGap && field.gapInstruction ? field.gapInstruction : "Information gap"}
          </span>
        </label>
      </div>
    )
  }

  // ── View mode ──
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-5 py-3 border-b border-border last:border-0",
        isOverridden && "border-l-2 border-l-primary"
      )}
    >
      <ScoreDot score={score} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{field.name}</span>
          {isOverridden && (
            <IconPencil className="size-3 text-muted-foreground/60 shrink-0" />
          )}
          {isDealbreaker && (
            <Badge variant="destructive" className="rounded-md text-[10px] px-1.5 h-4 shrink-0">
              Dealbreaker
            </Badge>
          )}
        </div>
        {content || isGap ? (
          <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
            {isGap && (
              <span className="font-medium text-amber-600 dark:text-amber-400">Gap — </span>
            )}
            {content || field.gapInstruction || "No information found for this field."}
          </p>
        ) : null}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScreeningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const screening = MOCK

  const [isEditMode, setIsEditMode] = useState(false)
  const [savedOverrides, setSavedOverrides] = useState<Record<string, FieldOverride>>({})
  const [draftOverrides, setDraftOverrides] = useState<Record<string, FieldOverride>>({})

  const allFields = useMemo(() => screening.categories.flatMap((c) => c.fields), [screening])

  const savedMaut = useMemo(() =>
    computeMaut(allFields.map((f) => ({ weight: f.weight, score: savedOverrides[f.id]?.score ?? f.aiScore }))),
    [allFields, savedOverrides]
  )

  const previewMaut = useMemo(() =>
    computeMaut(allFields.map((f) => ({ weight: f.weight, score: draftOverrides[f.id]?.score ?? savedOverrides[f.id]?.score ?? f.aiScore }))),
    [allFields, draftOverrides, savedOverrides]
  )

  const displayMaut = isEditMode ? previewMaut : savedMaut
  const mautChanged = isEditMode && Math.abs(previewMaut - savedMaut) > 0.001

  const stats = useMemo(() => {
    const ov = isEditMode ? draftOverrides : savedOverrides
    let db = 0, gaps = 0, overridden = 0
    for (const f of allFields) {
      const s: Score = ov[f.id]?.score ?? f.aiScore
      const g: boolean = ov[f.id]?.isGap ?? f.aiIsGap
      if (f.isDealbreakerField && s === -2) db++
      if (g) gaps++
    }
    for (const f of allFields) {
      const o = savedOverrides[f.id]
      if (o && (o.score !== f.aiScore || o.extractedContent !== f.aiExtractedContent || o.isGap !== f.aiIsGap)) overridden++
    }
    return { total: allFields.length, db, gaps, overridden }
  }, [allFields, savedOverrides, draftOverrides, isEditMode])

  const mautClass = "text-foreground"

  function enterEdit() {
    setDraftOverrides(
      Object.fromEntries(allFields.map((f) => [
        f.id,
        savedOverrides[f.id] ?? { score: f.aiScore, extractedContent: f.aiExtractedContent, isGap: f.aiIsGap },
      ]))
    )
    setIsEditMode(true)
  }

  function cancelEdit() {
    setDraftOverrides({})
    setIsEditMode(false)
  }

  function saveEdit() {
    const next: Record<string, FieldOverride> = {}
    for (const f of allFields) {
      const d = draftOverrides[f.id]
      if (d && (d.score !== f.aiScore || d.extractedContent !== f.aiExtractedContent || d.isGap !== f.aiIsGap))
        next[f.id] = d
    }
    setSavedOverrides(next)
    setDraftOverrides({})
    setIsEditMode(false)
  }

  function updateDraft(fieldId: string, changes: Partial<FieldOverride>) {
    setDraftOverrides((prev) => {
      const f = allFields.find((x) => x.id === fieldId)!
      const base = prev[fieldId] ?? {
        score: savedOverrides[fieldId]?.score ?? f.aiScore,
        extractedContent: savedOverrides[fieldId]?.extractedContent ?? f.aiExtractedContent,
        isGap: savedOverrides[fieldId]?.isGap ?? f.aiIsGap,
      }
      return { ...prev, [fieldId]: { ...base, ...changes } }
    })
  }

  function resetField(fieldId: string) {
    setDraftOverrides((prev) => { const n = { ...prev }; delete n[fieldId]; return n })
  }

  return (
    <div className="flex flex-col flex-1">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-8 py-3 gap-4">

          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/screenings")} aria-label="Back">
              <IconArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate leading-tight">
                {screening.template} · {screening.project}
              </h1>
              <p className="text-xs text-muted-foreground">{screening.screenedAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* MAUT */}
            <div className="flex items-baseline gap-1.5">
              {mautChanged && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">{savedMaut.toFixed(2)}</span>
              )}
              <span className={cn("text-2xl font-bold tabular-nums leading-none", mautClass)}>{displayMaut.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">/ 1</span>
            </div>

            {isEditMode ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <IconX className="size-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  <IconCheck className="size-4" />
                  Save review
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={enterEdit}>
                <IconPencil className="size-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="p-8 max-w-4xl w-full">
        <Card className="py-0 gap-0 overflow-hidden">

          {/* Card meta bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 rounded-md text-xs py-0">
                <span className={cn("size-1.5 rounded-[3px]", STATUS_DOT[screening.status])} />
                {screening.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{screening.document}</span>
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{stats.total}</span> fields
              </span>
              {stats.db > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{stats.db}</span> dealbreaker{stats.db !== 1 && "s"}
                </span>
              )}
              {stats.gaps > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{stats.gaps}</span> gap{stats.gaps !== 1 && "s"}
                </span>
              )}
              {stats.overridden > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{stats.overridden}</span> overridden
                </span>
              )}
            </div>
          </div>

          {/* Categories */}
          {screening.categories.map((cat) => (
            <Collapsible key={cat.id} defaultOpen>
              <CollapsibleTrigger className="group flex w-full items-center gap-2 px-5 py-2 bg-muted/30 border-b border-border text-left hover:bg-muted/50 transition-colors">
                <IconChevronDown className="size-3.5 text-muted-foreground/60 shrink-0 transition-transform group-data-closed:-rotate-90" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {cat.name}
                </span>
                <span className="text-[11px] text-muted-foreground/60">
                  {cat.fields.length}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {cat.fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    isEditMode={isEditMode}
                    savedOverride={savedOverrides[field.id]}
                    draftOverride={draftOverrides[field.id]}
                    onDraftChange={(p) => updateDraft(field.id, p)}
                    onReset={() => resetField(field.id)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}

        </Card>
      </div>

    </div>
  )
}
