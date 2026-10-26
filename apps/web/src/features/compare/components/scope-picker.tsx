"use client"

import { IconAdjustmentsHorizontal } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import type { TemplateCategory } from "@/features/screenings"

interface ScopePickerProps {
  categories: TemplateCategory[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}

export function ScopePicker({ categories, selected, onChange }: ScopePickerProps) {
  const allFields = categories.flatMap((c) => c.fields)

  function setFields(ids: string[], on: boolean) {
    const next = new Set(selected)
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
    onChange(next)
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <IconAdjustmentsHorizontal data-icon="inline-start" />
        Scope
        <span className="tabular-nums text-muted-foreground">
          {selected.size}/{allFields.length}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <div className="flex flex-col gap-1 p-3">
          <span className="text-sm font-medium">Assessment scope</span>
          <span className="text-xs text-muted-foreground">
            Choose the criteria to compare projects on. The scope score is recalculated from these only.
          </span>
          <div className="mt-2 flex gap-1.5">
            <Button variant="secondary" size="xs" onClick={() => onChange(new Set(allFields.map((f) => f.id)))}>
              All
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onChange(new Set(allFields.filter((f) => f.isDealbreakerField).map((f) => f.id)))}
            >
              Dealbreakers
            </Button>
            <Button variant="ghost" size="xs" onClick={() => onChange(new Set())}>
              Clear
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto p-3">
          {categories.map((category) => {
            const ids = category.fields.map((f) => f.id)
            const count = ids.filter((id) => selected.has(id)).length
            return (
              <div key={category.id} className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Checkbox
                    checked={count === ids.length}
                    indeterminate={count > 0 && count < ids.length}
                    onCheckedChange={(checked) => setFields(ids, checked)}
                  />
                  {category.name}
                </label>
                <div className="flex flex-col gap-1.5 pl-6">
                  {category.fields.map((field) => (
                    <label key={field.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected.has(field.id)}
                        onCheckedChange={(checked) => setFields([field.id], checked)}
                      />
                      <span className="flex-1 truncate">{field.name}</span>
                      {field.isDealbreakerField && <span className="text-[10px] font-medium text-indicator-db">DB</span>}
                      <span className="text-[10px] tabular-nums text-muted-foreground">×{field.weight.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
