"use client"

import { Fragment, useState } from "react"
import {
  IconBraces,
  IconBrackets,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconTable,
  IconTrash,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import {
  MAX_FACT_DEPTH,
  SCALAR_LABEL,
  elementType,
  toJsonSchema,
  typeLabel,
  validateFacts,
  type FactProperty,
  type FactType,
  type ListItemType,
  type ScalarType,
} from "../key-facts"

interface KeyFactsEditorProps {
  value: FactProperty[]
  onChange: (next: FactProperty[]) => void
}

const SCALARS = Object.keys(SCALAR_LABEL) as ScalarType[]

export function KeyFactsEditor({ value, onChange }: KeyFactsEditorProps) {
  const [view, setView] = useState<"form" | "json">("form")
  const problems = validateFacts(value)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Structured values the AI extracts for this criterion, each with its own source. Use objects and lists for
          repeated findings, up to {MAX_FACT_DEPTH} levels deep.
        </p>
        <ToggleGroup
          value={[view]}
          onValueChange={(v: string[]) => {
            if (v[0]) setView(v[0] as "form" | "json")
          }}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          <ToggleGroupItem value="form">
            <IconTable data-icon="inline-start" />
            Form
          </ToggleGroupItem>
          <ToggleGroupItem value="json">
            <IconBraces data-icon="inline-start" />
            JSON
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "json" ? (
        <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
          {value.length ? JSON.stringify(toJsonSchema(value), null, 2) : "// No key facts defined"}
        </pre>
      ) : (
        <PropertiesTable value={value} onChange={onChange} depth={1} path="" problems={problems} />
      )}
    </div>
  )
}

// ─── One level of properties ─────────────────────────────────────────────────

function PropertiesTable({
  value,
  onChange,
  depth,
  path,
  problems,
}: {
  value: FactProperty[]
  onChange: (next: FactProperty[]) => void
  depth: number
  path: string
  problems: Record<string, string>
}) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const update = (index: number, patch: Partial<FactProperty>) =>
    onChange(value.map((p, i) => (i === index ? { ...p, ...patch } : p)))

  function setType(index: number, type: FactType, itemType?: ListItemType) {
    const current = value[index]!
    const element = type === "list" ? itemType! : (type as ListItemType)
    update(index, {
      type,
      itemType: type === "list" ? itemType : undefined,
      unit: element === "number" || element === "integer" ? current.unit : undefined,
      options: element === "choice" ? (current.options?.length ? current.options : [{ value: "", description: "" }]) : undefined,
      properties:
        element === "object"
          ? current.properties?.length
            ? current.properties
            : [{ key: "", type: "text", description: "", required: false }]
          : undefined,
    })
  }

  const toggle = (index: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-background", depth > 1 && "rounded-md")}>
      <table className="w-full table-fixed text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="w-[32%] px-3 py-2 font-medium">Key</th>
            <th className="w-[30%] px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Description</th>
            <th className="w-11 px-1 py-2 text-center font-medium" title="Required">
              Req.
            </th>
            <th className="w-9" />
          </tr>
        </thead>
        <tbody>
          {value.map((property, index) => {
            const rowPath = path ? `${path}.${index}` : String(index)
            const element = elementType(property)
            const configurable = element === "object" || element === "choice" || element === "number" || element === "integer"
            const open = !collapsed.has(index)
            const name = property.key || "this property"
            return (
              <Fragment key={index}>
                <tr className="border-t border-border align-top">
                  <td className="px-2 py-1.5">
                    <Input
                      value={property.key}
                      onChange={(e) => update(index, { key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                      placeholder="property_key"
                      aria-label="Property key"
                      aria-invalid={!!problems[rowPath] || undefined}
                      title={problems[rowPath]}
                      className="h-8 font-mono text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <TypePicker property={property} allowNesting={depth < MAX_FACT_DEPTH} onPick={(t, item) => setType(index, t, item)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={property.description}
                      onChange={(e) => update(index, { description: e.target.value })}
                      placeholder="What the value means"
                      aria-label="Description"
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <Checkbox
                      checked={property.required}
                      onCheckedChange={(checked) => update(index, { required: checked })}
                      aria-label="Required"
                      className="mt-2"
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove property"
                      onClick={() => onChange(value.filter((_, i) => i !== index))}
                    >
                      <IconTrash />
                    </Button>
                  </td>
                </tr>

                {(configurable || problems[rowPath]) && (
                  <tr>
                    <td colSpan={5} className="px-3 pb-2.5">
                      {problems[rowPath] && <p className="pb-1 text-xs text-destructive">{problems[rowPath]}</p>}
                      {configurable && (
                        <button
                          type="button"
                          onClick={() => toggle(index)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <IconChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
                          {element === "object"
                            ? `Configure schema for ${name}${property.type === "list" ? " items" : ""}`
                            : element === "choice"
                              ? `Configure choices for ${name}`
                              : `Unit for ${name}`}
                        </button>
                      )}
                      {open && element === "object" && (
                        <div className="mt-2 border-l-2 border-border pl-3">
                          <PropertiesTable
                            value={property.properties ?? []}
                            onChange={(properties) => update(index, { properties })}
                            depth={depth + 1}
                            path={rowPath}
                            problems={problems}
                          />
                        </div>
                      )}
                      {open && element === "choice" && (
                        <ChoiceEditor options={property.options ?? []} onChange={(options) => update(index, { options })} />
                      )}
                      {open && (element === "number" || element === "integer") && (
                        <Input
                          value={property.unit ?? ""}
                          onChange={(e) => update(index, { unit: e.target.value || undefined })}
                          placeholder="e.g. dB, m², DKK"
                          aria-label="Unit"
                          className="mt-2 h-8 w-48 text-xs"
                        />
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          <tr className="border-t border-border">
            <td colSpan={5}>
              <button
                type="button"
                onClick={() => onChange([...value, { key: "", type: "text", description: "", required: false }])}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <IconPlus className="size-4" />
                Add property
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Type picker ─────────────────────────────────────────────────────────────

function TypePicker({
  property,
  allowNesting,
  onPick,
}: {
  property: FactProperty
  allowNesting: boolean
  onPick: (type: FactType, itemType?: ListItemType) => void
}) {
  const structured = property.type === "object" || property.type === "list"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-8 w-full items-center justify-between gap-1 rounded-lg border border-input bg-transparent px-2 text-left text-xs hover:bg-accent dark:bg-input/30"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {property.type === "list" ? (
            <IconBrackets className="size-3.5 shrink-0 text-muted-foreground" />
          ) : property.type === "object" ? (
            <IconBraces className="size-3.5 shrink-0 text-muted-foreground" />
          ) : null}
          <span className="truncate">{typeLabel(property)}</span>
        </span>
        <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Value</DropdownMenuLabel>
          {SCALARS.map((t) => (
            <DropdownMenuItem key={t} onClick={() => onPick(t)}>
              {SCALAR_LABEL[t]}
              {!structured && property.type === t && <ActiveDot />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Structure</DropdownMenuLabel>
          <DropdownMenuItem disabled={!allowNesting} onClick={() => onPick("object")}>
            <IconBraces />
            Object
            {property.type === "object" && <ActiveDot />}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <IconBrackets />
              List of…
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem disabled={!allowNesting} onClick={() => onPick("list", "object")}>
                  Objects
                  {property.type === "list" && property.itemType === "object" && <ActiveDot />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPick("list", "choice")}>
                  Choices
                  {property.type === "list" && property.itemType === "choice" && <ActiveDot />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {SCALARS.filter((t) => t !== "choice").map((t) => (
                  <DropdownMenuItem key={t} onClick={() => onPick("list", t)}>
                    {SCALAR_LABEL[t]}
                    {property.type === "list" && property.itemType === t && <ActiveDot />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActiveDot() {
  return <span className="ml-auto size-1.5 rounded-full bg-primary" aria-label="Selected" />
}

// ─── Choices ─────────────────────────────────────────────────────────────────

function ChoiceEditor({
  options,
  onChange,
}: {
  options: { value: string; description: string }[]
  onChange: (next: { value: string; description: string }[]) => void
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-border">
      <table className="w-full table-fixed text-xs">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="w-[38%] px-3 py-1.5 font-medium">Value</th>
            <th className="px-3 py-1.5 font-medium">Description</th>
            <th className="w-9" />
          </tr>
        </thead>
        <tbody>
          {options.map((option, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-2 py-1">
                <Input
                  value={option.value}
                  onChange={(e) => onChange(options.map((o, j) => (j === i ? { ...o, value: e.target.value } : o)))}
                  placeholder="value"
                  aria-label="Choice value"
                  className="h-7 font-mono text-xs"
                />
              </td>
              <td className="px-2 py-1">
                <Input
                  value={option.description}
                  onChange={(e) => onChange(options.map((o, j) => (j === i ? { ...o, description: e.target.value } : o)))}
                  placeholder="Optional"
                  aria-label="Choice description"
                  className="h-7 text-xs"
                />
              </td>
              <td className="px-1 py-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Remove choice"
                  onClick={() => onChange(options.filter((_, j) => j !== i))}
                >
                  <IconTrash />
                </Button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-border">
            <td colSpan={3}>
              <button
                type="button"
                onClick={() => onChange([...options, { value: "", description: "" }])}
                className="flex w-full items-center justify-center gap-1 py-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <IconPlus className="size-3.5" />
                Add choice
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
