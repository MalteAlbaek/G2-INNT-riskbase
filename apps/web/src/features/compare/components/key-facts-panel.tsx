"use client"

import { useState } from "react"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { FactEntry } from "@/features/screenings"
import {
  elementType,
  formatElement,
  formatFactValue,
  isScalarFact,
  type FactProperty,
  type FactValue,
  type ListItemType,
} from "@/features/templates/key-facts"
import { cn } from "@/lib/utils"

interface KeyFactsPanelProps {
  properties: FactProperty[]
  facts: Record<string, FactEntry>
  onSet: (key: string, value: FactValue | null) => void
}

/** The criterion's key facts: AI-extracted values a reviewer can confirm, correct or fill in. */
export function KeyFactsPanel({ properties, facts, onSet }: KeyFactsPanelProps) {
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <dl className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {properties.map((property) => {
        const entry = facts[property.key] ?? {}
        const current = entry.reviewer?.value ?? entry.ai
        const edited = entry.reviewer !== undefined
        const missing = current === undefined
        const scalar = isScalarFact(property)
        const aiDiffers =
          edited && entry.ai !== undefined && JSON.stringify(entry.ai) !== JSON.stringify(entry.reviewer!.value)

        return (
          <div key={property.key} className="flex flex-col gap-2 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <dt className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-xs text-foreground">
                  {property.key}
                  {property.required && <span className="text-muted-foreground"> *</span>}
                </span>
                {property.description && (
                  <span className="text-[11px] leading-snug text-muted-foreground">{property.description}</span>
                )}
              </dt>
              {editing !== property.key && (
                <dd className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  {missing ? (
                    <span className={cn("text-sm", property.required ? "text-indicator-gap" : "text-muted-foreground")}>
                      Not found
                    </span>
                  ) : (
                    scalar && <span className="text-sm font-medium tabular-nums">{formatFactValue(property, current)}</span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {edited ? (
                      <>
                        {aiDiffers && scalar && <span className="line-through">AI {formatFactValue(property, entry.ai!)}</span>}
                        {aiDiffers && !scalar && "Corrected from AI"}
                        {aiDiffers && " · "}
                        Set by {entry.reviewer!.by}
                      </>
                    ) : (
                      !missing && "AI"
                    )}
                  </span>
                </dd>
              )}
            </div>

            {editing !== property.key && !missing && !scalar && <FactValueView property={property} value={current} />}

            {editing === property.key ? (
              <FactForm
                property={property}
                initial={current}
                onCancel={() => setEditing(null)}
                onSave={(value) => {
                  onSet(property.key, value)
                  setEditing(null)
                }}
              />
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="xs" onClick={() => setEditing(property.key)}>
                  {missing ? "Add value" : edited ? "Change" : "Correct"}
                </Button>
                {edited && (
                  <Button variant="ghost" size="xs" onClick={() => onSet(property.key, null)}>
                    {entry.ai !== undefined ? "Use AI value" : "Clear"}
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </dl>
  )
}

// ─── Showing nested values ───────────────────────────────────────────────────

function FactValueView({ property, value }: { property: FactProperty; value: FactValue }) {
  if (property.type === "list" && Array.isArray(value)) {
    if (property.itemType !== "object") {
      return <p className="text-sm">{formatFactValue(property, value)}</p>
    }
    const columns = property.properties ?? []
    return (
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-2.5 py-1.5 font-mono font-normal whitespace-nowrap">
                  {c.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row, i) => (
              <tr key={i} className="border-t border-border align-top">
                {columns.map((c) => {
                  const cell = (row as Record<string, FactValue>)?.[c.key]
                  return (
                    <td key={c.key} className="px-2.5 py-1.5">
                      {cell === undefined ? "—" : formatFactValue(c, cell)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (property.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    return (
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-muted/40 px-3 py-2 text-xs">
        {(property.properties ?? []).map((c) => (
          <div key={c.key} className="contents">
            <dt className="font-mono text-muted-foreground">{c.key}</dt>
            <dd>
              {value[c.key] === undefined ? (
                "—"
              ) : isScalarFact(c) ? (
                formatFactValue(c, value[c.key]!)
              ) : (
                <FactValueView property={c} value={value[c.key]!} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    )
  }
  return null
}

// ─── Entering values ─────────────────────────────────────────────────────────
// Inputs hold raw strings while typing; `clean` turns the draft into a value
// (or undefined when nothing usable was entered).

type Draft = FactValue | undefined

function cleanElement(type: ListItemType, p: FactProperty, draft: Draft): Draft {
  if (draft === undefined) return undefined
  switch (type) {
    case "boolean":
      return typeof draft === "boolean" ? draft : undefined
    case "number":
    case "integer": {
      const n = typeof draft === "number" ? draft : String(draft).trim() === "" ? NaN : Number(draft)
      return Number.isFinite(n) ? n : undefined
    }
    case "object": {
      if (typeof draft !== "object" || Array.isArray(draft)) return undefined
      const out: Record<string, FactValue> = {}
      for (const child of p.properties ?? []) {
        const v = clean(child, draft[child.key])
        if (v !== undefined) out[child.key] = v
      }
      return Object.keys(out).length ? out : undefined
    }
    default:
      return String(draft).trim() || undefined
  }
}

function clean(p: FactProperty, draft: Draft): Draft {
  if (p.type === "list") {
    if (!Array.isArray(draft)) return undefined
    const items = draft.map((d) => cleanElement(p.itemType ?? "text", p, d)).filter((v): v is FactValue => v !== undefined)
    return items.length ? items : undefined
  }
  return cleanElement(p.type as ListItemType, p, draft)
}

/** Required properties missing anywhere inside a cleaned object value. */
function missingRequired(p: FactProperty, value: Draft): boolean {
  const element = elementType(p)
  if (element !== "object") return false
  const objects = p.type === "list" ? ((value as FactValue[] | undefined) ?? []) : value === undefined ? [] : [value]
  return objects.some((o) =>
    (p.properties ?? []).some((child) => {
      const v = (o as Record<string, FactValue>)[child.key]
      return (child.required && v === undefined) || (v !== undefined && missingRequired(child, v))
    })
  )
}

function FactForm({
  property,
  initial,
  onSave,
  onCancel,
}: {
  property: FactProperty
  initial: FactValue | undefined
  onSave: (value: FactValue) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const value = clean(property, draft)
  const incomplete = value !== undefined && missingRequired(property, value)

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (value !== undefined && !incomplete) onSave(value)
      }}
    >
      <ValueInput property={property} draft={draft} onChange={setDraft} />
      <div className="flex items-center justify-end gap-2">
        {incomplete && <span className="mr-auto text-[11px] text-destructive">Fill in the required fields (*)</span>}
        <Button type="button" variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="xs" disabled={value === undefined || incomplete}>
          Save
        </Button>
      </div>
    </form>
  )
}

function ValueInput({ property, draft, onChange }: { property: FactProperty; draft: Draft; onChange: (d: Draft) => void }) {
  if (property.type !== "list") {
    return <ElementInput type={property.type as ListItemType} property={property} draft={draft} onChange={onChange} />
  }
  const items = Array.isArray(draft) ? draft : []
  const itemType = property.itemType ?? "text"
  const blank = (): FactValue => (itemType === "object" ? {} : "")
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div key={i} className={cn("flex items-start gap-1.5", itemType === "object" && "rounded-md border border-border p-2")}>
          <div className="min-w-0 flex-1">
            <ElementInput
              type={itemType}
              property={property}
              draft={item}
              onChange={(d) => onChange(items.map((x, j) => (j === i ? (d ?? blank()) : x)))}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Remove item"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <IconTrash />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="xs" className="self-start" onClick={() => onChange([...items, blank()])}>
        <IconPlus data-icon="inline-start" />
        Add {itemType === "object" ? "item" : "value"}
      </Button>
    </div>
  )
}

function ElementInput({
  type,
  property,
  draft,
  onChange,
}: {
  type: ListItemType
  property: FactProperty
  draft: Draft
  onChange: (d: Draft) => void
}) {
  if (type === "object") {
    const obj = draft && typeof draft === "object" && !Array.isArray(draft) ? draft : {}
    return (
      <div className="flex flex-col gap-1.5">
        {(property.properties ?? []).map((child) => (
          <label key={child.key} className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-muted-foreground">
              {child.key}
              {child.required && " *"}
            </span>
            <ValueInput
              property={child}
              draft={obj[child.key]}
              onChange={(d) => {
                const next = { ...obj }
                if (d === undefined) delete next[child.key]
                else next[child.key] = d
                onChange(next)
              }}
            />
          </label>
        ))}
      </div>
    )
  }
  if (type === "boolean") {
    return (
      <ToggleGroup
        value={draft === undefined ? [] : [draft ? "yes" : "no"]}
        onValueChange={(v: string[]) => onChange(v[0] === undefined ? undefined : v[0] === "yes")}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
        <ToggleGroupItem value="no">No</ToggleGroupItem>
      </ToggleGroup>
    )
  }
  if (type === "choice") {
    return (
      <Select
        items={(property.options ?? []).map((o) => ({ value: o.value, label: o.value }))}
        value={typeof draft === "string" && draft ? draft : null}
        onValueChange={(v: string | null) => onChange(v ?? undefined)}
      >
        <SelectTrigger size="sm" className="w-full" aria-label={property.key}>
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {(property.options ?? []).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.value}
              {o.description && <span className="text-muted-foreground"> — {o.description}</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  const numeric = type === "number" || type === "integer"
  return (
    <div className="flex items-center gap-2">
      <Input
        type={numeric ? "number" : type === "date" ? "date" : "text"}
        step={type === "integer" ? 1 : numeric ? "any" : undefined}
        value={draft === undefined ? "" : String(draft)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        aria-label={property.key}
        className="h-8 text-sm"
      />
      {numeric && property.unit && <span className="text-xs text-muted-foreground">{property.unit}</span>}
      {/* Keep the formatted preview for dates visible to avoid locale confusion. */}
      {type === "date" && typeof draft === "string" && draft && (
        <span className="shrink-0 text-[11px] text-muted-foreground">{formatElement("date", property, draft)}</span>
      )}
    </div>
  )
}
