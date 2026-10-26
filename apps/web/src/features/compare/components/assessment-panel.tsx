"use client"

import { useState } from "react"
import { IconX } from "@tabler/icons-react"
import { SidePanel } from "@/components/blocks/side-panel"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ProspectAssessment, Recommendation, TemplateField } from "@/features/screenings"
import type { CaseFile, Finding } from "../assessment"
import type { CompareProject } from "../types"
import { DataRoom } from "./data-room"
import { GapPill, RECOMMENDATION_LABEL, ScoreMeter, ScorePill } from "./score-chip"

interface AssessmentPanelProps {
  project: CompareProject
  templateName: string
  caseFile: CaseFile
  score: number | null
  assessment: ProspectAssessment | undefined
  onSave: (draft: Pick<ProspectAssessment, "conclusion" | "recommendation" | "status">) => void
  onOpenCriterion: (field: TemplateField) => void
  /** documentName → number of criteria citing it */
  citedBy: Record<string, number>
  onUpload: (files: File[]) => void
  onOpenDocument: (documentName: string, focus?: { page: number; quote: string }) => void
  onClose: () => void
}

export function AssessmentPanel({
  project,
  templateName,
  caseFile,
  score,
  assessment,
  onSave,
  onOpenCriterion,
  citedBy,
  onUpload,
  onOpenDocument,
  onClose,
}: AssessmentPanelProps) {
  const { risks, strengths, open, evidence, progress } = caseFile
  const isFinal = assessment?.status === "final"

  const citedDocs = new Set(evidence.map((e) => e.documentName))
  const otherDocs = project.documents.filter((d) => !citedDocs.has(d.name))

  return (
    <SidePanel id="compare-assessment" defaultWidth={560} aria-label="Prospect assessment">
      <div className="flex items-start gap-2 border-b border-border bg-card px-6 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{templateName}</span>
          <span className="text-base font-semibold">{project.name}</span>
          <span className="text-xs text-muted-foreground">
            {isFinal
              ? `Final · ${assessment.author}, ${assessment.updatedAt}`
              : `Draft · ${progress.reviewed} of ${progress.total} criteria reviewed`}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
          <IconX />
        </Button>
      </div>

      <Tabs defaultValue="assessment" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="border-b border-border bg-card px-6">
          <TabsList variant="line">
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="data-room">
              Data room <span className="tabular-nums text-muted-foreground">{project.documents.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="data-room" className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <DataRoom documents={project.documents} citedBy={citedBy} onUpload={onUpload} onOpen={(name) => onOpenDocument(name)} />
        </TabsContent>

        <TabsContent value="assessment" className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 py-6">
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
            <Stat label="Score">
              {score === null ? "—" : score.toFixed(2)}
              <ScoreMeter value={score} />
            </Stat>
            <Stat label="Reviewed">
              {progress.reviewed}/{progress.total}
            </Stat>
            <Stat label="Open items">{progress.open}</Stat>
          </dl>

          <FindingList title="Key risks" findings={risks} empty="No risks identified." onOpen={onOpenCriterion} />
          <FindingList title="Strengths" findings={strengths} empty="No strengths identified." onOpen={onOpenCriterion} />

          {open.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-sm font-semibold text-foreground">Open items</h3>
              <ul className="flex flex-col gap-2">
                {open.map((item) => (
                  <li key={item.field.id}>
                    <button
                      type="button"
                      onClick={() => onOpenCriterion(item.field)}
                      className="-mx-2 flex w-[calc(100%+1rem)] flex-col gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <GapPill />
                        {item.field.name}
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">{item.note}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Separator />

          <AssessmentForm
            key={assessment?.updatedAt ?? "new"}
            assessment={assessment}
            canConclude={progress.reviewed === progress.total}
            remaining={progress.total - progress.reviewed}
            onSave={onSave}
          />

          <Separator />

          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-foreground">Evidence</h3>
            {evidence.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sources cited yet.</p>
            ) : (
              <ol className="flex flex-col gap-1">
                {evidence.map((e) => (
                  <li key={e.ref} className="flex gap-2 text-xs">
                    <span className="w-6 shrink-0 font-medium tabular-nums text-primary">[{e.ref}]</span>
                    <button
                      type="button"
                      onClick={() => onOpenDocument(e.documentName, { page: e.page ?? 1, quote: e.quote })}
                      className="text-left text-foreground hover:text-primary hover:underline"
                    >
                      {e.documentName}, p. {e.page}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {otherDocs.length > 0 && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Also in the data room, not cited: {otherDocs.map((d) => d.name).join(", ")}
              </p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </SidePanel>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 bg-card px-3.5 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-1.5 text-lg font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

function FindingList({
  title,
  findings,
  empty,
  onOpen,
}: {
  title: string
  findings: Finding[]
  empty: string
  onOpen: (field: TemplateField) => void
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {findings.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {findings.map((f) => (
            <li key={f.field.id}>
              <button
                type="button"
                onClick={() => onOpen(f.field)}
                className="-mx-2 flex w-[calc(100%+1rem)] gap-3 rounded-md px-2 py-1.5 text-left hover:bg-accent"
              >
                <ScorePill score={f.score} reviewed={f.reviewed} className="mt-px" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {f.field.name}
                    {f.dealbreaker && <span className="text-destructive"> · dealbreaker</span>}
                    {!f.reviewed && <span className="text-xs text-muted-foreground"> · AI, not reviewed</span>}
                  </span>
                  <span className="text-xs leading-relaxed text-foreground/75">
                    {f.text}
                    {f.refs.length > 0 && <span className="font-medium tabular-nums text-primary"> {f.refs.map((r) => `[${r}]`).join("")}</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AssessmentForm({
  assessment,
  canConclude,
  remaining,
  onSave,
}: {
  assessment: ProspectAssessment | undefined
  canConclude: boolean
  remaining: number
  onSave: AssessmentPanelProps["onSave"]
}) {
  const [conclusion, setConclusion] = useState(assessment?.conclusion ?? "")
  const [recommendation, setRecommendation] = useState<Recommendation | null>(assessment?.recommendation ?? null)

  const dirty = conclusion !== (assessment?.conclusion ?? "") || recommendation !== (assessment?.recommendation ?? null)
  // A firm recommendation needs a complete review; Hold can be concluded with open items.
  const canFinalize =
    conclusion.trim().length > 0 && recommendation !== null && (canConclude || recommendation === "hold")

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Conclusion</h3>
      <Textarea
        value={conclusion}
        onChange={(e) => setConclusion(e.target.value)}
        placeholder="Summarise the case for this prospect: what the evidence shows, the decisive risks and strengths, and what remains uncertain."
        aria-label="Conclusion"
        className="min-h-32 text-sm leading-relaxed"
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Recommendation</span>
        <ToggleGroup
          value={recommendation ? [recommendation] : []}
          onValueChange={(v: string[]) => setRecommendation((v[0] as Recommendation | undefined) ?? null)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {(Object.keys(RECOMMENDATION_LABEL) as Recommendation[]).map((r) => (
            <ToggleGroupItem key={r} value={r} className="flex-1">
              {RECOMMENDATION_LABEL[r]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {!canConclude && `${remaining} criteria not yet reviewed — finalise once reviewed, or recommend Hold.`}
        </span>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!dirty}
            onClick={() => onSave({ conclusion: conclusion.trim(), recommendation, status: "draft" })}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            disabled={!canFinalize || (assessment?.status === "final" && !dirty)}
            onClick={() => onSave({ conclusion: conclusion.trim(), recommendation, status: "final" })}
          >
            Finalise assessment
          </Button>
        </div>
      </div>
    </section>
  )
}
