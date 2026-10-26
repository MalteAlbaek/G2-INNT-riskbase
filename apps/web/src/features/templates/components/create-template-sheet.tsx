"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ResizableSheetContent } from "@/components/blocks/side-panel"
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createTemplate } from "../actions"

interface CreateTemplateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTemplateSheet({ open, onOpenChange }: CreateTemplateSheetProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createTemplate({ name })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setName("")
      onOpenChange(false)
      router.push(`/templates/${result.value!.id}`)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <ResizableSheetContent id="create-template" defaultWidth={560}>
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Create template</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex flex-col gap-2 px-6 py-6">
            <label htmlFor="template-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="template-name"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              aria-invalid={!!error || undefined}
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter className="mt-auto px-6 py-5 border-t border-border flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Save
            </Button>
          </SheetFooter>
        </form>
      </ResizableSheetContent>
    </Sheet>
  )
}
