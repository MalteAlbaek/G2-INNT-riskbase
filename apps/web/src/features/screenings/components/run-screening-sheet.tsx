"use client"

import { useMemo, useState } from "react"
import { IconFileText } from "@tabler/icons-react"
import { ResizableSheetContent } from "@/components/blocks/side-panel"
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { PROJECTS, PROJECT_DOCUMENTS } from "@/features/projects"
import { cn } from "@/lib/utils"

const TEMPLATES = [
  { id: "1", name: "Miljø Screener" },
  { id: "2", name: "NCC Standard" },
]

interface RunScreeningSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RunScreeningSheet({ open, onOpenChange }: RunScreeningSheetProps) {
  const [projectId, setProjectId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [documentIds, setDocumentIds] = useState<string[]>([])

  const projectDocuments = useMemo(
    () => (projectId ? (PROJECT_DOCUMENTS[projectId] ?? []) : []),
    [projectId]
  )

  function handleProjectChange(value: string | null) {
    if (!value) return
    setProjectId(value)
    // Default to using every already-parsed document as the basis for the screening.
    setDocumentIds(
      (PROJECT_DOCUMENTS[value] ?? []).filter((d) => d.status === "ready").map((d) => d.id)
    )
  }

  function toggleDocument(docId: string, checked: boolean) {
    setDocumentIds((prev) => (checked ? [...prev, docId] : prev.filter((id) => id !== docId)))
  }

  function reset() {
    setProjectId("")
    setTemplateId("")
    setDocumentIds([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: wire to API — run screening for `projectId`/`templateId` using `documentIds`
    reset()
    onOpenChange(false)
  }

  function handleCancel() {
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <ResizableSheetContent id="run-screening" defaultWidth={560}>
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Run screening</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col gap-6 px-6 py-6 overflow-y-auto flex-1">

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="run-screening-project">Project</FieldLabel>
                <Select value={projectId} onValueChange={handleProjectChange}>
                  <SelectTrigger id="run-screening-project" className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="run-screening-template">Template</FieldLabel>
                <Select value={templateId} onValueChange={(v: string | null) => { if (v) setTemplateId(v) }}>
                  <SelectTrigger id="run-screening-template" className="w-full">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            {projectId && (
              <FieldSet>
                <FieldLegend variant="label">Documents</FieldLegend>
                <FieldDescription>
                  Choose which of the project&apos;s uploaded documents to use as the basis for this screening.
                </FieldDescription>

                {projectDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded for this project yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {projectDocuments.map((doc) => {
                      const disabled = doc.status !== "ready"
                      const selected = documentIds.includes(doc.id)
                      return (
                        <Label
                          key={doc.id}
                          htmlFor={`run-screening-doc-${doc.id}`}
                          data-disabled={disabled || undefined}
                          className={cn(
                            "items-start gap-3 rounded-xl border-2 p-3 font-normal transition-colors",
                            disabled ? "cursor-not-allowed" : "cursor-pointer",
                            selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                          )}
                        >
                          <Checkbox
                            id={`run-screening-doc-${doc.id}`}
                            checked={selected}
                            onCheckedChange={(checked) => toggleDocument(doc.id, checked)}
                            disabled={disabled}
                            className="mt-0.5"
                          />
                          <IconFileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex flex-col min-w-0 gap-0.5">
                            <span className="text-sm font-medium text-foreground truncate">{doc.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {disabled ? "Still processing — not available yet" : "Parsed and ready"}
                            </span>
                          </div>
                        </Label>
                      )
                    })}
                  </div>
                )}
              </FieldSet>
            )}

          </div>

          <SheetFooter className="px-6 py-5 border-t border-border flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit" disabled={!projectId || !templateId || documentIds.length === 0}>
              Run screening
            </Button>
          </SheetFooter>
        </form>
      </ResizableSheetContent>
    </Sheet>
  )
}
