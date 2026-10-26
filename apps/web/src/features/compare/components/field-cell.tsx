"use client"

import { IconPlus } from "@tabler/icons-react"
import { isDealbreaker, type CellReview, type FieldResult, type TemplateField } from "@/features/screenings"
import { cn } from "@/lib/utils"
import { ScoreDot } from "./score-chip"

interface FieldCellProps {
  cellId: string
  field: TemplateField
  result: FieldResult | undefined
  review: CellReview | undefined
  selected: boolean
  onSelect: () => void
}

export function FieldCell({ cellId, field, result, review, selected, onSelect }: FieldCellProps) {
  const base =
    "flex size-full min-h-full scroll-mt-24 scroll-ml-[340px] flex-col justify-start gap-1.5 px-3 py-2.5 text-left outline-none transition-colors"

  // Nothing from the AI and nobody has assessed it yet: invite a manual assessment.
  if (!result && !review) {
    return (
      <button
        type="button"
        data-cell={cellId}
        onClick={onSelect}
        aria-label={`Assess ${field.name} manually`}
        className={cn(
          base,
          "group/empty min-h-16 justify-center hover:bg-accent/60 hover:ring-1 hover:ring-border hover:ring-dashed hover:ring-inset focus-visible:bg-accent/60",
          selected && "bg-accent ring-2 ring-primary/60 ring-inset"
        )}
      >
        <span className="text-xs text-muted-foreground group-hover/empty:hidden">—</span>
        <span className="hidden items-center gap-1 text-[11px] text-muted-foreground group-hover/empty:flex">
          <IconPlus className="size-3" />
          Add manually
        </span>
      </button>
    )
  }

  const isGap = review ? review.status === "follow_up" : !!result?.isGap
  const dealbreaker = isDealbreaker(field, result, review)
  const summary = review?.rationale || (isGap ? field.gapInstruction : result?.extractedContent)

  return (
    <button
      type="button"
      data-cell={cellId}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(base, "hover:bg-accent focus-visible:bg-accent", selected && "bg-accent ring-2 ring-primary/60 ring-inset")}
    >
      <span className="flex items-start gap-2">
        <ScoreDot
          score={isGap ? null : (review?.score ?? result!.score)}
          reviewed={!!review}
          gap={isGap}
          className="mt-[3px]"
        />
        <span className="line-clamp-3 text-xs leading-snug text-foreground/80">
          {summary || (isGap ? "Information gap" : "—")}
        </span>
      </span>
      {(dealbreaker || !review || review.status === "manual") && (
        <span className="flex gap-2 pl-[18px] text-[10px]">
          {dealbreaker && <span className="font-semibold text-destructive">Dealbreaker</span>}
          {!review && <span className="text-muted-foreground" title="AI proposal — not reviewed yet">AI</span>}
          {review?.status === "manual" && <span className="text-muted-foreground">Manual</span>}
        </span>
      )}
    </button>
  )
}
