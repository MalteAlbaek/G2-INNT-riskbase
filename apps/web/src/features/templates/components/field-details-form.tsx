"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { validateFacts } from "../key-facts"
import type { TemplateFieldConfig } from "../types"
import { KeyFactsEditor } from "./key-facts-editor"

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
      {children}
    </span>
  )
}

interface FieldDetailsPanelProps {
  field: TemplateFieldConfig
  onDirtyChange: (dirty: boolean) => void
  onCancel: () => void
  onSave: (updated: TemplateFieldConfig) => void
}

export function FieldDetailsPanel({ field, onDirtyChange, onCancel, onSave }: FieldDetailsPanelProps) {
  const [name, setName] = useState(field.name)
  const [weight, setWeight] = useState(Math.round(field.weight * 100))
  const [extractionPrompt, setExtractionPrompt] = useState(field.extractionPrompt)
  const [gapInstruction, setGapInstruction] = useState(field.gapInstruction)
  const [required, setRequired] = useState(field.required)
  const [dealbreaker, setDealbreaker] = useState(field.dealbreaker)
  const [keyFacts, setKeyFacts] = useState(field.keyFacts)
  const factsInvalid = Object.keys(validateFacts(keyFacts)).length > 0

  const isDirty =
    name !== field.name ||
    weight !== Math.round(field.weight * 100) ||
    extractionPrompt !== field.extractionPrompt ||
    gapInstruction !== field.gapInstruction ||
    required !== field.required ||
    dealbreaker !== field.dealbreaker ||
    JSON.stringify(keyFacts) !== JSON.stringify(field.keyFacts)

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [name, weight, extractionPrompt, gapInstruction, required, dealbreaker, keyFacts])

  function handleDealbreaker(v: boolean) {
    setDealbreaker(v)
    if (v) setRequired(true)
  }

  function handleReset() {
    setName(field.name)
    setWeight(Math.round(field.weight * 100))
    setExtractionPrompt(field.extractionPrompt)
    setGapInstruction(field.gapInstruction)
    setRequired(field.required)
    setDealbreaker(field.dealbreaker)
    setKeyFacts(field.keyFacts)
  }

  function handleSave() {
    if (factsInvalid) return
    onSave({ ...field, name, weight: weight / 100, extractionPrompt, gapInstruction, required, dealbreaker, keyFacts })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col gap-6 px-6 py-6 overflow-y-auto flex-1">

        <div className="flex flex-col gap-4">
          <SectionLabel>Basic info</SectionLabel>
          <div className="flex flex-col gap-2">
            <label htmlFor="detail-name" className="text-sm font-medium text-foreground">Field name</label>
            <Input id="detail-name" value={name} onChange={(e) => setName(e.target.value)} />
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
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-border">
          <SectionLabel>Extraction guidance</SectionLabel>
          <div className="flex flex-col gap-2">
            <label htmlFor="detail-extraction" className="text-sm">
              <span className="font-medium text-foreground">Extraction prompt</span>
              <span className="text-muted-foreground"> — what information should be extracted</span>
            </label>
            <textarea
              id="detail-extraction"
              value={extractionPrompt}
              onChange={(e) => setExtractionPrompt(e.target.value)}
              rows={4}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="detail-gap" className="text-sm">
              <span className="font-medium text-primary">Gap instruction</span>
              <span className="text-muted-foreground"> — what constitutes missing info?</span>
            </label>
            <textarea
              id="detail-gap"
              value={gapInstruction}
              onChange={(e) => setGapInstruction(e.target.value)}
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-border">
          <SectionLabel>Key facts</SectionLabel>
          <KeyFactsEditor value={keyFacts} onChange={setKeyFacts} />
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-border">
          <SectionLabel>Flags</SectionLabel>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Required</span>
              <span className="text-xs text-muted-foreground">Must be scored for screening to complete</span>
            </div>
            <Switch
              checked={required}
              onCheckedChange={(v: boolean) => setRequired(v)}
              disabled={dealbreaker}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Dealbreaker</span>
              <span className="text-xs text-muted-foreground">Automatically marks field as required</span>
            </div>
            <Switch checked={dealbreaker} onCheckedChange={handleDealbreaker} />
          </div>
        </div>

      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
        {isDirty ? (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!isDirty}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isDirty || !name.trim() || factsInvalid}>Save</Button>
        </div>
      </div>
    </div>
  )
}
