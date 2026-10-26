"use client"

import { useState } from "react"
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react"
import { SidePanel } from "@/components/blocks/side-panel"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  formatScore,
  isDealbreaker,
  type CellEvent,
  type CellEventType,
  type CellReview,
  type FieldResult,
  type Score,
  type SourceRef,
  type TemplateField,
} from "@/features/screenings"
import type { FactEntry } from "@/features/screenings"
import type { FactValue } from "@/features/templates/key-facts"
import { KeyFactsPanel } from "./key-facts-panel"
import { ManualForm } from "./manual-form"
import { ScorePill } from "./score-chip"

const SCORES: Score[] = [-2, -1, 0, 1, 2]

type Mode = "accept" | "override" | "follow_up"

export interface ReviewPanelProps {
  projectId: string
  projectName: string
  screeningId: string
  categoryName: string
  field: TemplateField
  /** Missing when the AI made no proposal for this criterion. */
  result: FieldResult | undefined
  review: CellReview | undefined
  events: CellEvent[]
  /** AI-cited sources plus any reviewers added. */
  sources: SourceRef[]
  onOpenSource: (source: SourceRef) => void
  facts: Record<string, FactEntry>
  onSetFact: (key: string, value: FactValue | null) => void
  position: { index: number; total: number }
  onReview: (status: CellReview["status"], score: Score, rationale: string, advance: boolean) => void
  onReopen: () => void
  onNavigate: (dir: -1 | 1) => void
  onClose: () => void
}

export function ReviewPanel(props: ReviewPanelProps) {
  const { projectName, screeningId, categoryName, field, result, review, events, sources, position } = props

  return (
    <SidePanel id="compare-criterion" defaultWidth={440} aria-label="Criterion review">
      <div className="flex items-start gap-2 border-b border-border bg-card px-5 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-xs text-muted-foreground">
            {projectName} · {categoryName}
          </span>
          <span className="font-semibold">{field.name}</span>
        </div>
        <span className="pt-0.5 text-[11px] tabular-nums text-muted-foreground">
          {position.index + 1} / {position.total}
        </span>
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" aria-label="Previous criterion" onClick={() => props.onNavigate(-1)}>
            <IconChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next criterion" onClick={() => props.onNavigate(1)}>
            <IconChevronRight />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={props.onClose}>
            <IconX />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
        {/* ── What the material says ── */}
        <section className="flex flex-col gap-3">
          <SectionTitle
            aside={result && <span className="tabular-nums">{result.confidence}% confidence</span>}
          >
            AI finding
          </SectionTitle>

          {result ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-3.5">
              {result.isGap ? (
                <p className="text-sm leading-relaxed text-foreground/80">
                  The uploaded material does not contain enough to assess this criterion.
                  {field.gapInstruction && <span className="mt-1 block text-foreground">{field.gapInstruction}</span>}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ScorePill score={result.score} reviewed={false} />
                    Proposed by AI
                    {isDealbreaker(field, result) && <span className="font-medium text-destructive">· Dealbreaker</span>}
                  </span>
                  <p className="text-sm leading-relaxed">{result.extractedContent}</p>
                </div>
              )}

                {sources.length ? (
                <ul className="flex flex-col gap-2">
                  {sources.map((source, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => props.onOpenSource(source)}
                        className="group/src flex w-full flex-col gap-1 rounded-md bg-background px-3 py-2 text-left ring-1 ring-transparent transition-shadow hover:ring-primary/40"
                      >
                        <q className="text-xs leading-relaxed text-foreground/80">{source.quote}</q>
                        <span className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-medium text-primary group-hover/src:underline">
                            {source.documentName}, p. {source.page}
                          </span>
                          {source.addedBy && <span className="text-muted-foreground">Added by {source.addedBy}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                !result.isGap && (
                  <p className="text-xs text-muted-foreground">No source cited. Verify against the material before accepting.</p>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3.5">
              <p className="text-sm leading-relaxed text-foreground/80">
                The AI made no proposal for this criterion. Assess it manually below, with a rationale that refers to the
                material.
              </p>
              {sources.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {sources.map((source, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => props.onOpenSource(source)}
                        className="flex w-full flex-col gap-1 rounded-md bg-background px-3 py-2 text-left text-xs ring-1 ring-border hover:ring-primary/40"
                      >
                        <q className="leading-relaxed text-foreground/80">{source.quote}</q>
                        <span className="font-medium text-primary">
                          {source.documentName}
                          {source.page ? `, p. ${source.page}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Collapsible>
            <CollapsibleTrigger className="group/c flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <IconChevronDown className="size-3.5 transition-transform group-data-panel-open/c:rotate-180" />
              Criterion definition
            </CollapsibleTrigger>
            <CollapsibleContent>
              <dl className="mt-2 flex flex-col gap-2 text-xs">
                <Definition term="Extraction prompt">{field.extractionPrompt || "—"}</Definition>
                <Definition term="If information is missing">{field.gapInstruction || "—"}</Definition>
                <Definition term="Weight">
                  ×{field.weight.toFixed(2)}
                  {field.isDealbreakerField && " · −2 makes the prospect a dealbreaker"}
                </Definition>
              </dl>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {field.keyFacts && field.keyFacts.length > 0 && (
          <>
            <Separator />
            <section className="flex flex-col gap-3">
              <SectionTitle aside="Values are checked against the criterion's definition">Key facts</SectionTitle>
              <KeyFactsPanel properties={field.keyFacts} facts={props.facts} onSet={props.onSetFact} />
            </section>
          </>
        )}

        <Separator />

        {/* ── The reviewer's judgement ── */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Your assessment</SectionTitle>
          {review ? (
            <ReviewSummary review={review} aiScore={result?.score} onReopen={props.onReopen} />
          ) : result ? (
            <ReviewForm key={`${screeningId}:${field.id}`} result={result} field={field} onSubmit={props.onReview} />
          ) : (
            <ManualForm key={`${screeningId}:${field.id}`} field={field} onSubmit={props.onReview} showNext />
          )}
        </section>

        {events.length > 1 && (
          <>
            <Separator />
            <section className="flex flex-col gap-3">
              <SectionTitle>History</SectionTitle>
              <History events={events} />
            </section>
          </>
        )}
      </div>
    </SidePanel>
  )
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
      {aside && <span className="text-[11px] text-muted-foreground">{aside}</span>}
    </div>
  )
}

function Definition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="leading-relaxed">{children}</dd>
    </div>
  )
}

// ─── Review ──────────────────────────────────────────────────────────────────

const PLACEHOLDER: Record<Mode, string> = {
  accept: "Note (optional) — e.g. where you verified it",
  override: "Why the proposed score is wrong, with reference to the material",
  follow_up: "What is missing and how it will be obtained",
}

function ReviewForm({
  result,
  field,
  onSubmit,
}: {
  result: FieldResult
  field: TemplateField
  onSubmit: ReviewPanelProps["onReview"]
}) {
  const [mode, setMode] = useState<Mode>(result.isGap ? "follow_up" : "accept")
  const [score, setScore] = useState<Score>(result.score)
  const [rationale, setRationale] = useState(result.isGap ? field.gapInstruction : "")

  const text = rationale.trim()
  const valid =
    mode === "accept" || (text.length > 0 && (mode === "follow_up" || result.isGap || score !== result.score))

  function submit(advance: boolean) {
    if (!valid) return
    const status = mode === "accept" ? "accepted" : mode === "override" ? "overridden" : "follow_up"
    onSubmit(status, mode === "override" ? score : result.score, text, advance)
  }

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        value={[mode]}
        onValueChange={(v: string[]) => {
          if (v[0]) setMode(v[0] as Mode)
        }}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {!result.isGap && (
          <ToggleGroupItem value="accept" className="flex-1">
            Agree
          </ToggleGroupItem>
        )}
        <ToggleGroupItem value="override" className="flex-1">
          {result.isGap ? "Score it" : "Adjust"}
        </ToggleGroupItem>
        <ToggleGroupItem value="follow_up" className="flex-1">
          Needs information
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "override" && (
        <ToggleGroup
          value={[String(score)]}
          onValueChange={(v: string[]) => {
            if (v[0]) setScore(Number(v[0]) as Score)
          }}
          variant="outline"
          size="sm"
          className="w-full"
          aria-label="Score"
        >
          {SCORES.map((s) => (
            <ToggleGroupItem
              key={s}
              value={String(s)}
              className="flex-1 tabular-nums"
              disabled={!result.isGap && s === result.score}
            >
              {formatScore(s).replace("-", "−")}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      <Textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(true)
        }}
        placeholder={PLACEHOLDER[mode]}
        aria-label="Rationale"
        className="min-h-20 text-sm"
      />

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" disabled={!valid} onClick={() => submit(false)}>
          Save
        </Button>
        <Button size="sm" disabled={!valid} onClick={() => submit(true)}>
          Save and next
        </Button>
      </div>
    </div>
  )
}

const STATUS_TEXT: Record<CellReview["status"], string> = {
  accepted: "Agreed with AI",
  overridden: "Adjusted",
  follow_up: "Needs information",
  manual: "Assessed manually",
}

function ReviewSummary({ review, aiScore, onReopen }: { review: CellReview; aiScore?: Score; onReopen: () => void }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3.5">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {STATUS_TEXT[review.status]}
        {review.status !== "follow_up" && (
          <>
            {" · "}
            {review.status === "overridden" && aiScore !== undefined && (
              <ScorePill score={aiScore} reviewed={false} className="line-through opacity-60" />
            )}{" "}
            <ScorePill score={review.score} />
          </>
        )}
      </span>
      {review.rationale && <p className="text-sm leading-relaxed">{review.rationale}</p>}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {review.reviewer} · {review.reviewedAt}
        </span>
        <Button variant="ghost" size="xs" onClick={onReopen}>
          Change
        </Button>
      </div>
    </div>
  )
}

const EVENT_VERB: Record<CellEventType, string> = {
  ai_assessed: "AI proposed",
  accepted: "agreed",
  overridden: "adjusted",
  follow_up: "requested information",
  reopened: "reopened",
  evidence_added: "added evidence",
  manual: "assessed manually",
  fact_updated: "set a key fact",
}

function History({ events }: { events: CellEvent[] }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 text-xs">
          <span>
            {event.type === "ai_assessed" ? (
              <>
                AI proposed <span className="tabular-nums">{event.toScore !== undefined && formatScore(event.toScore)}</span>
              </>
            ) : (
              <>
                <span className="font-medium">{event.actor}</span> {EVENT_VERB[event.type]}
                {event.fromScore !== undefined && event.toScore !== undefined && (
                  <span className="tabular-nums">
                    {" "}
                    {formatScore(event.fromScore)} → {formatScore(event.toScore)}
                  </span>
                )}
              </>
            )}
            <span className="text-muted-foreground"> · {event.at}</span>
          </span>
          {event.text && <span className="leading-relaxed text-muted-foreground">{event.text}</span>}
        </li>
      ))}
    </ol>
  )
}
