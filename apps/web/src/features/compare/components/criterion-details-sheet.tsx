"use client"

import { ResizableSheetContent } from "@/components/blocks/side-panel"
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  finalScore,
  isDealbreaker,
  type CellFacts,
  type CellReview,
  type Score,
  type TemplateField,
  type TemplateScreening,
} from "@/features/screenings"
import { FACT_TYPE_LABEL, formatFactValue } from "@/features/templates/key-facts"
import { cn } from "@/lib/utils"
import { GapPill, ScorePill } from "./score-chip"

const SCORES: Score[] = [-2, -1, 0, 1, 2]
const BAR: Record<Score, string> = {
  "-2": "bg-score-n2",
  "-1": "bg-score-n1",
  "0": "bg-score-0",
  "1": "bg-score-p1",
  "2": "bg-score-p2",
}

interface CriterionDetailsSheetProps {
  field: TemplateField | null
  categoryName: string
  screenings: TemplateScreening[]
  reviews: Record<string, Record<string, CellReview>>
  facts: Record<string, CellFacts>
  onOpenCell: (screening: TemplateScreening) => void
  onClose: () => void
}

/** One criterion across all prospects: its definition, the spread of scores and every row. */
export function CriterionDetailsSheet({
  field,
  categoryName,
  screenings,
  reviews,
  facts,
  onOpenCell,
  onClose,
}: CriterionDetailsSheetProps) {
  const rows = field
    ? screenings
        .filter((s) => s.results[field.id])
        .map((s) => {
          const result = s.results[field.id]!
          const review = reviews[s.id]?.[field.id]
          return {
            screening: s,
            result,
            review,
            score: finalScore(result, review),
            gap: review ? review.status === "follow_up" : result.isGap,
            dealbreaker: isDealbreaker(field, result, review),
          }
        })
    : []

  const distribution = SCORES.map((score) => ({ score, count: rows.filter((r) => !r.gap && r.score === score).length }))
  const max = Math.max(1, ...distribution.map((d) => d.count))
  const reviewed = rows.filter((r) => r.review && r.review.status !== "follow_up").length
  const gaps = rows.filter((r) => r.gap).length
  const dealbreakers = rows.filter((r) => r.dealbreaker).length

  return (
    <Sheet open={!!field} onOpenChange={(open) => !open && onClose()}>
      <ResizableSheetContent id="criterion-details" defaultWidth={520}>
        {field && (
          <>
            <SheetHeader className="border-b border-border px-6 py-5">
              <SheetDescription>{categoryName}</SheetDescription>
              <SheetTitle>{field.name}</SheetTitle>
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                <span className="tabular-nums">Weight ×{field.weight.toFixed(2)}</span>
                {field.required && <span>Required</span>}
                {field.isDealbreakerField && <span className="text-destructive">Dealbreaker if −2</span>}
              </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-6 py-6">
              {/* Across prospects */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Across prospects</h3>
                <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
                  <Stat label="Reviewed">
                    {reviewed}/{rows.length}
                  </Stat>
                  <Stat label="Gaps">{gaps}</Stat>
                  <Stat label="Dealbreakers" className={dealbreakers ? "text-destructive" : undefined}>
                    {dealbreakers}
                  </Stat>
                </dl>
                <div className="flex items-end gap-2" aria-label="Score distribution">
                  {distribution.map(({ score, count }) => (
                    <div key={score} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="text-[11px] tabular-nums text-muted-foreground">{count}</span>
                      <div className="flex h-16 w-full items-end rounded bg-muted">
                        <div
                          className={cn("w-full rounded opacity-70", BAR[score])}
                          style={{ height: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <ScorePill score={score} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Every prospect */}
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Prospects</h3>
                <ul className="flex flex-col">
                  {rows.map((r) => {
                    const cellFacts = facts[r.screening.id]?.[field.id] ?? {}
                    return (
                      <li key={r.screening.id} className="border-b border-border last:border-0">
                        <button
                          type="button"
                          onClick={() => onOpenCell(r.screening)}
                          className="-mx-2 flex w-[calc(100%+1rem)] gap-3 rounded-md px-2 py-2.5 text-left hover:bg-accent"
                        >
                          <span className="mt-0.5">
                            {r.gap ? <GapPill /> : <ScorePill score={r.score ?? r.result.score} reviewed={!!r.review} />}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {r.screening.project}
                              {r.dealbreaker && <span className="text-destructive"> · dealbreaker</span>}
                            </span>
                            <span className="line-clamp-2 text-xs leading-relaxed text-foreground/75">
                              {r.review?.rationale || (r.gap ? field.gapInstruction : r.result.extractedContent) || "—"}
                            </span>
                            {(field.keyFacts ?? []).length > 0 && (
                              <span className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5 text-[11px] text-muted-foreground">
                                {field.keyFacts!.map((fact) => {
                                  const entry = cellFacts[fact.key]
                                  const value = entry?.reviewer?.value ?? entry?.ai
                                  return (
                                    <span key={fact.key}>
                                      <span className="font-mono">{fact.key}</span>{" "}
                                      <span className="text-foreground">{value === undefined ? "—" : formatFactValue(fact, value)}</span>
                                    </span>
                                  )
                                })}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>

              {/* Definition */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Definition</h3>
                <dl className="flex flex-col gap-3 text-sm">
                  <Definition term="Extraction prompt">{field.extractionPrompt || "—"}</Definition>
                  <Definition term="If information is missing">{field.gapInstruction || "—"}</Definition>
                  {(field.keyFacts ?? []).length > 0 && (
                    <Definition term="Key facts">
                      <ul className="flex flex-col gap-1">
                        {field.keyFacts!.map((fact) => (
                          <li key={fact.key} className="flex gap-2 text-xs">
                            <span className="font-mono">{fact.key}</span>
                            <span className="text-muted-foreground">
                              {FACT_TYPE_LABEL[fact.type]}
                              {fact.unit && ` (${fact.unit})`}
                              {fact.required && " · required"}
                              {fact.description && ` — ${fact.description}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Definition>
                  )}
                </dl>
              </section>
            </div>
          </>
        )}
      </ResizableSheetContent>
    </Sheet>
  )
}

function Stat({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-card px-3.5 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-base font-semibold tabular-nums", className)}>{children}</dd>
    </div>
  )
}

function Definition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="leading-relaxed">{children}</dd>
    </div>
  )
}
