"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatScore, type CellReview, type Score, type TemplateField } from "@/features/screenings"

const SCORES: Score[] = [-2, -1, 0, 1, 2]

type Mode = "score" | "follow_up"

/**
 * Assess a criterion the AI didn't: give it a score with a rationale, or record that the
 * information is missing. Either way the reviewer has to say why.
 */
export function ManualForm({
  field,
  onSubmit,
  showNext = false,
}: {
  field: TemplateField
  onSubmit: (status: Extract<CellReview["status"], "manual" | "follow_up">, score: Score, rationale: string, advance: boolean) => void
  showNext?: boolean
}) {
  const [mode, setMode] = useState<Mode>("score")
  const [score, setScore] = useState<Score | null>(null)
  const [rationale, setRationale] = useState("")

  const text = rationale.trim()
  const valid = text.length > 0 && (mode === "follow_up" || score !== null)

  function submit(advance: boolean) {
    if (!valid) return
    onSubmit(mode === "score" ? "manual" : "follow_up", mode === "score" ? score! : 0, text, advance)
  }

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        value={[mode]}
        onValueChange={(v: string[]) => {
          if (!v[0]) return
          setMode(v[0] as Mode)
          if (v[0] === "follow_up" && !rationale) setRationale(field.gapInstruction)
        }}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <ToggleGroupItem value="score" className="flex-1">
          Score it
        </ToggleGroupItem>
        <ToggleGroupItem value="follow_up" className="flex-1">
          Needs information
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "score" && (
        <ToggleGroup
          value={score === null ? [] : [String(score)]}
          onValueChange={(v: string[]) => setScore(v[0] === undefined ? null : (Number(v[0]) as Score))}
          variant="outline"
          size="sm"
          className="w-full"
          aria-label="Score"
        >
          {SCORES.map((s) => (
            <ToggleGroupItem key={s} value={String(s)} className="flex-1 tabular-nums">
              {formatScore(s).replace("-", "−")}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      <Textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(showNext)
        }}
        placeholder={
          mode === "score"
            ? "Rationale — what the score is based on, with reference to the material"
            : "What is missing and how it will be obtained"
        }
        aria-label="Rationale"
        className="min-h-20 text-sm"
      />

      <div className="flex items-center justify-end gap-2">
        <Button variant={showNext ? "ghost" : "default"} size="sm" disabled={!valid} onClick={() => submit(false)}>
          Save
        </Button>
        {showNext && (
          <Button size="sm" disabled={!valid} onClick={() => submit(true)}>
            Save and next
          </Button>
        )}
      </div>
    </div>
  )
}
