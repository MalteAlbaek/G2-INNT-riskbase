"use client"

import { useState } from "react"
import { ResizableSheetContent } from "@/components/blocks/side-panel"
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

export interface CategoryFormData {
  id?: string
  name: string
  weight: number
  description: string
}

interface CreateCategorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: CategoryFormData
  onSave: (data: CategoryFormData) => void
}

export function CreateCategorySheet({ open, onOpenChange, initialData, onSave }: CreateCategorySheetProps) {
  const isEditing = !!initialData?.id
  // The parent remounts this sheet (via `key`) each time it opens, so state starts fresh.
  const [name, setName] = useState(initialData?.name ?? "")
  const [weight, setWeight] = useState(initialData?.weight ?? 50)
  const [description, setDescription] = useState(initialData?.description ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ id: initialData?.id, name: name.trim(), weight, description: description.trim() })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <ResizableSheetContent id="edit-category" defaultWidth={560}>
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>{isEditing ? "Edit category" : "Create category"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col gap-6 px-6 py-6 overflow-y-auto flex-1">
            <div className="flex flex-col gap-2">
              <label htmlFor="cat-name" className="text-sm font-medium text-foreground">Name</label>
              <Input
                id="cat-name"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Weight</label>
                <span className="text-sm text-muted-foreground tabular-nums">{weight}%</span>
              </div>
              <Slider
                value={[weight]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setWeight(typeof v === "number" ? v : v[0])}
              />
              <p className="text-xs text-muted-foreground">Higher weight = stronger influence on the final risk score</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="cat-desc" className="text-sm font-medium text-foreground">Description</label>
              <textarea
                id="cat-desc"
                placeholder="Enter category description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-5 border-t border-border flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? "Save changes" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </ResizableSheetContent>
    </Sheet>
  )
}
