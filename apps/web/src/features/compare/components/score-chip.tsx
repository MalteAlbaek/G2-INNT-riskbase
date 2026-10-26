import { formatScore, type Recommendation, type Score } from "@/features/screenings"
import { cn } from "@/lib/utils"

// Tint carries the level; the fill carries the review state.
const SCALE: Record<Score, { reviewed: string; proposed: string }> = {
  "-2": { reviewed: "bg-score-n2-bg text-score-n2", proposed: "border-score-n2/50 text-score-n2" },
  "-1": { reviewed: "bg-score-n1-bg text-score-n1", proposed: "border-score-n1/50 text-score-n1" },
  "0": { reviewed: "bg-score-0-bg text-score-0", proposed: "border-score-0/40 text-score-0" },
  "1": { reviewed: "bg-score-p1-bg text-score-p1", proposed: "border-score-p1/50 text-score-p1" },
  "2": { reviewed: "bg-score-p2-bg text-score-p2", proposed: "border-score-p2/50 text-score-p2" },
}

const pill =
  "inline-flex h-5 min-w-7 shrink-0 items-center justify-center rounded-md border px-1.5 text-xs font-semibold tabular-nums"

/**
 * A −2…+2 score. Reviewed scores are filled; an unreviewed AI proposal is outlined
 * with a dashed border, so the level stays readable while the status is obvious.
 */
export function ScorePill({
  score,
  reviewed = true,
  className,
}: {
  score: Score
  reviewed?: boolean
  className?: string
}) {
  const tone = SCALE[score]
  return (
    <span
      className={cn(
        pill,
        reviewed ? cn("border-transparent", tone.reviewed) : cn("border-dashed bg-transparent", tone.proposed),
        className
      )}
      title={reviewed ? undefined : "AI proposal — not yet reviewed"}
    >
      {formatScore(score).replace("-", "−")}
    </span>
  )
}

export function GapPill({ className }: { className?: string }) {
  return (
    <span className={cn(pill, "border-dashed border-indicator-gap/50 font-medium text-indicator-gap", className)}>
      Gap
    </span>
  )
}

const RECOMMENDATION: Record<Recommendation, { label: string; tone: string }> = {
  go: { label: "Proceed", tone: "bg-score-p1-bg text-score-p1" },
  hold: { label: "Hold", tone: "bg-score-n1-bg text-score-n1" },
  no_go: { label: "Do not proceed", tone: "bg-score-n2-bg text-score-n2" },
}

export const RECOMMENDATION_LABEL = Object.fromEntries(
  Object.entries(RECOMMENDATION).map(([k, v]) => [k, v.label])
) as Record<Recommendation, string>

export function RecommendationTag({ value, className }: { value: Recommendation; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium", RECOMMENDATION[value].tone, className)}>
      {RECOMMENDATION[value].label}
    </span>
  )
}

/** Horizontal 0…1 meter for aggregate scores, coloured by the same scale. */
export function ScoreMeter({ value }: { value: number | null }) {
  const tone =
    value === null ? "bg-muted" : value < 0.35 ? "bg-score-n2" : value < 0.5 ? "bg-score-n1" : value < 0.65 ? "bg-score-0" : "bg-score-p1"
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <span className={cn("block h-full rounded-full opacity-70", tone)} style={{ width: `${(value ?? 0) * 100}%` }} />
    </span>
  )
}

// Same risk palette as the Overview: Low · Medium · High · Critical.
const DOT: Record<Score, string> = {
  "-2": "bg-destructive",
  "-1": "bg-severe",
  "0": "bg-warning",
  "1": "bg-success",
  "2": "bg-success",
}

/**
 * Compact score indicator for grid cells: a solid rounded square in exactly the Overview's
 * risk colours (grey for an information gap). Review status is shown next to the text, so
 * the colours never differ from the Overview. The number lives in the tooltip and side panel.
 */
export function ScoreDot({
  score,
  reviewed,
  gap = false,
  className,
}: {
  score: Score | null
  reviewed: boolean
  gap?: boolean
  className?: string
}) {
  const label = gap
    ? "Information gap"
    : `Score ${formatScore(score ?? 0).replace("-", "−")} · ${reviewed ? "reviewed" : "AI proposal, not reviewed"}`
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-[3px]",
        gap ? "bg-indicator-gap" : DOT[score ?? 0],
        className
      )}
    />
  )
}
