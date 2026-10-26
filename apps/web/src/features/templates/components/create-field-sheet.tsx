"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { FieldInput } from "../actions"

interface Category {
  id: string
  name: string
}

interface CreateFieldSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  defaultCategoryId?: string
  onCreate: (categoryId: string, input: FieldInput) => void
}

export function CreateFieldSheet({ open, onOpenChange, categories, defaultCategoryId, onCreate }: CreateFieldSheetProps) {
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? "")
  const [weight, setWeight] = useState(50)
  const [extractionPrompt, setExtractionPrompt] = useState("")
  const [gapInstruction, setGapInstruction] = useState("")
  const [required, setRequired] = useState(false)
  const [dealbreaker, setDealbreaker] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const target = categoryId || defaultCategoryId || categories[0]?.id
    if (!target || !name.trim()) return
    onCreate(target, {
      name: name.trim(),
      weight: weight / 100,
      required: required || dealbreaker,
      dealbreaker,
      extractionPrompt,
      gapInstruction,
    })
    reset()
    onOpenChange(false)
  }

  function handleCancel() {
    reset()
    onOpenChange(false)
  }

  function reset() {
    setName("")
    setCategoryId(defaultCategoryId ?? categories[0]?.id ?? "")
    setWeight(50)
    setExtractionPrompt("")
    setGapInstruction("")
    setRequired(false)
    setDealbreaker(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <ResizableSheetContent id="create-field" defaultWidth={560}>
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Create field</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col gap-6 px-6 py-6 overflow-y-auto flex-1">

            <div className="flex flex-col gap-2">
              <label htmlFor="field-name" className="text-sm font-medium text-foreground">
                Field name
              </label>
              <Input
                id="field-name"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Field category</label>
              <Select value={categoryId} onValueChange={(v: string | null) => { if (v) setCategoryId(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="extraction-prompt" className="text-sm">
                <span className="font-medium text-foreground">Extraction prompt</span>
                <span className="text-muted-foreground"> — what information should be extracted</span>
              </label>
              <textarea
                id="extraction-prompt"
                placeholder="Extraction prompt"
                value={extractionPrompt}
                onChange={(e) => setExtractionPrompt(e.target.value)}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gap-instruction" className="text-sm">
                <span className="font-medium text-primary">Gap instruction</span>
                <span className="text-muted-foreground"> — what constitutes missing info?</span>
              </label>
              <textarea
                id="gap-instruction"
                placeholder="Gap instruction"
                value={gapInstruction}
                onChange={(e) => setGapInstruction(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              />
            </div>

            <div className="flex flex-col gap-4 pt-2 border-t border-border">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">Required</span>
                  <span className="text-xs text-muted-foreground">Must be scored for screening to complete</span>
                </div>
                <Switch
                  checked={required}
                  onCheckedChange={(v: boolean) => setRequired(v)}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">Dealbreaker</span>
                  <span className="text-xs text-muted-foreground">Must be scored for screening to complete</span>
                </div>
                <Switch
                  checked={dealbreaker}
                  onCheckedChange={(v: boolean) => setDealbreaker(v)}
                />
              </div>
            </div>

          </div>

          <SheetFooter className="px-6 py-5 border-t border-border flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </SheetFooter>
        </form>
      </ResizableSheetContent>
    </Sheet>
  )
}
