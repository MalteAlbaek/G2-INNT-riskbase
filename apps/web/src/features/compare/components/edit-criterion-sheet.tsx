"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ResizableSheetContent } from "@/components/blocks/side-panel"
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { TemplateField } from "@/features/screenings"
import { updateField } from "@/features/templates/actions"
import { FieldDetailsPanel } from "@/features/templates/components/field-details-form"

interface EditCriterionSheetProps {
  templateId: string
  templateName: string
  screeningCount: number
  field: TemplateField | null
  onClose: () => void
}

/** Edits a criterion in place, with the same form as the template editor. */
export function EditCriterionSheet({ templateId, templateName, screeningCount, field, onClose }: EditCriterionSheetProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Sheet open={!!field} onOpenChange={(open) => !open && !pending && onClose()}>
      <ResizableSheetContent id="edit-criterion" defaultWidth={600}>
        {field && (
          <>
            <SheetHeader className="border-b border-border px-6 py-5">
              <SheetDescription>{templateName}</SheetDescription>
              <SheetTitle>Edit criterion</SheetTitle>
              {screeningCount > 0 && (
                <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                  Changes apply to all {screeningCount} screening{screeningCount === 1 ? "" : "s"} using this template,
                  including their scores.
                </p>
              )}
              {error && (
                <p role="alert" className="pt-1 text-xs text-destructive">
                  {error}
                </p>
              )}
            </SheetHeader>
            <FieldDetailsPanel
              key={field.id}
              field={{
                id: field.id,
                name: field.name,
                weight: field.weight,
                required: field.required ?? field.isDealbreakerField,
                dealbreaker: field.isDealbreakerField,
                extractionPrompt: field.extractionPrompt,
                gapInstruction: field.gapInstruction,
                keyFacts: field.keyFacts ?? [],
                inUse: true,
              }}
              onDirtyChange={() => {}}
              onCancel={onClose}
              onSave={(updated) => {
                setError(null)
                startTransition(async () => {
                  const result = await updateField(templateId, field.id, {
                    name: updated.name,
                    weight: updated.weight,
                    required: updated.required,
                    dealbreaker: updated.dealbreaker,
                    extractionPrompt: updated.extractionPrompt,
                    gapInstruction: updated.gapInstruction,
                    keyFacts: updated.keyFacts,
                  })
                  if (!result.ok) {
                    setError(result.error)
                    return
                  }
                  router.refresh()
                  onClose()
                })
              }}
            />
          </>
        )}
      </ResizableSheetContent>
    </Sheet>
  )
}
