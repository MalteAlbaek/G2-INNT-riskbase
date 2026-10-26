import type { Json } from "@riskbase/db-types"

/**
 * Key facts are the structured properties a criterion extracts. Template authors edit
 * them as (nested) rows; they're stored as JSON Schema (see the field_key_facts and
 * nested_key_facts migrations), which is what the AI pipeline consumes.
 */
export type ScalarType = "text" | "number" | "integer" | "date" | "boolean" | "choice"
export type FactType = ScalarType | "object" | "list"
/** What a list holds. Lists of lists aren't supported — wrap them in an object. */
export type ListItemType = ScalarType | "object"

export interface FactOption {
  value: string
  description: string
}

export interface FactProperty {
  key: string
  type: FactType
  description: string
  required: boolean
  /** list only */
  itemType?: ListItemType
  /** number / integer, or a list of them */
  unit?: string
  /** choice, or a list of choices */
  options?: FactOption[]
  /** object, or a list of objects */
  properties?: FactProperty[]
}

export type FactValue = string | number | boolean | FactValue[] | { [key: string]: FactValue }

/** Top level counts as 1; objects and lists can't be added below this depth. */
export const MAX_FACT_DEPTH = 3

export const SCALAR_LABEL: Record<ScalarType, string> = {
  text: "Text",
  number: "Number",
  integer: "Integer",
  date: "Date",
  boolean: "Yes / no",
  choice: "Choice",
}

export const FACT_TYPE_LABEL: Record<FactType, string> = { ...SCALAR_LABEL, object: "Object", list: "List" }

export function typeLabel(p: Pick<FactProperty, "type" | "itemType">): string {
  if (p.type !== "list") return FACT_TYPE_LABEL[p.type]
  return `List of ${p.itemType === "object" ? "objects" : (SCALAR_LABEL[p.itemType ?? "text"] ?? "").toLowerCase()}`
}

/** The kind of thing a property (or a list's items) holds. */
export const elementType = (p: FactProperty): ListItemType => (p.type === "list" ? (p.itemType ?? "text") : (p.type as ListItemType))

/** Lowercase snake_case, starting with a letter — safe as a JSON property name. */
export const FACT_KEY_PATTERN = /^[a-z][a-z0-9_]*$/

// ─── To JSON Schema ──────────────────────────────────────────────────────────

function objectSchema(properties: FactProperty[]): Record<string, Json> {
  return {
    type: "object",
    properties: Object.fromEntries(properties.map((p) => [p.key, propertySchema(p)])),
    required: properties.filter((p) => p.required).map((p) => p.key),
    "x-property-order": properties.map((p) => p.key),
    additionalProperties: false,
  }
}

function elementSchema(type: ListItemType, p: FactProperty): Record<string, Json> {
  switch (type) {
    case "text":
      return { type: "string" }
    case "number":
    case "integer":
      return { type, ...(p.unit ? { "x-unit": p.unit } : {}) }
    case "date":
      return { type: "string", format: "date" }
    case "boolean":
      return { type: "boolean" }
    case "choice": {
      const options = (p.options ?? []).filter((o) => o.value.trim())
      const descriptions = Object.fromEntries(options.filter((o) => o.description).map((o) => [o.value, o.description]))
      return {
        type: "string",
        enum: options.map((o) => o.value),
        ...(Object.keys(descriptions).length ? { "x-enum-descriptions": descriptions } : {}),
      }
    }
    case "object":
      return objectSchema(p.properties ?? [])
  }
}

function propertySchema(p: FactProperty): Json {
  const description = p.description ? { description: p.description } : {}
  if (p.type === "list") return { type: "array", items: elementSchema(p.itemType ?? "text", p), ...description }
  return { ...elementSchema(p.type, p), ...description }
}

export function toJsonSchema(properties: FactProperty[]): Json | null {
  return properties.length ? objectSchema(properties) : null
}

// ─── From JSON Schema ────────────────────────────────────────────────────────

type Schema = {
  type?: string
  format?: string
  description?: string
  enum?: string[]
  items?: Schema
  properties?: Record<string, Schema>
  required?: string[]
  "x-unit"?: string
  "x-enum-descriptions"?: Record<string, string>
  "x-property-order"?: string[]
}

function parseObject(schema: Schema): FactProperty[] {
  const properties = schema.properties ?? {}
  const order = schema["x-property-order"] ?? []
  const keys = [...order.filter((k) => k in properties), ...Object.keys(properties).filter((k) => !order.includes(k))]
  const required = new Set(schema.required ?? [])
  return keys.map((key) => parseProperty(key, properties[key]!, required.has(key)))
}

function parseElement(s: Schema): Pick<FactProperty, "unit" | "options" | "properties"> & { type: ListItemType } {
  if (s.enum) {
    const descriptions = s["x-enum-descriptions"] ?? {}
    return { type: "choice", options: s.enum.map((value) => ({ value, description: descriptions[value] ?? "" })) }
  }
  if (s.type === "object") return { type: "object", properties: parseObject(s) }
  if (s.type === "number" || s.type === "integer") return { type: s.type, unit: s["x-unit"] }
  if (s.type === "boolean") return { type: "boolean" }
  if (s.type === "string" && s.format === "date") return { type: "date" }
  return { type: "text" }
}

function parseProperty(key: string, s: Schema, required: boolean): FactProperty {
  const common = { key, description: s.description ?? "", required }
  if (s.type === "array") {
    const { type: itemType, ...rest } = parseElement(s.items ?? {})
    return { ...common, type: "list", itemType, ...rest }
  }
  return { ...common, ...parseElement(s) }
}

export function fromJsonSchema(schema: Json | null | undefined): FactProperty[] {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return []
  return parseObject(schema as Schema)
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** Problems that would make the schema unusable, keyed by row path ("0", "0.2", …). */
export function validateFacts(properties: FactProperty[], prefix = ""): Record<string, string> {
  const problems: Record<string, string> = {}
  const seen = new Set<string>()
  properties.forEach((p, i) => {
    const path = prefix ? `${prefix}.${i}` : String(i)
    const element = elementType(p)
    if (!FACT_KEY_PATTERN.test(p.key)) problems[path] = "Use lowercase letters, digits and underscores, starting with a letter"
    else if (seen.has(p.key)) problems[path] = "Each key must be unique"
    else if (element === "choice" && !(p.options ?? []).some((o) => o.value.trim())) problems[path] = "Add at least one choice"
    else if (element === "object" && !(p.properties ?? []).length) problems[path] = "Add at least one property"
    seen.add(p.key)
    if (element === "object") Object.assign(problems, validateFacts(p.properties ?? [], path))
  })
  return problems
}

// ─── Values ──────────────────────────────────────────────────────────────────

export function isScalarFact(p: FactProperty) {
  return p.type !== "object" && p.type !== "list"
}

function formatScalar(type: ScalarType, p: FactProperty, value: FactValue): string {
  if (type === "boolean") return value ? "Yes" : "No"
  if (type === "number" || type === "integer") return `${value}${p.unit ? ` ${p.unit}` : ""}`
  if (type === "date" && typeof value === "string") {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { dateStyle: "medium" })
  }
  return String(value)
}

/** One-line summary of a value, e.g. "62 dB", "PAH, oil" or "3 items". */
export function formatFactValue(p: FactProperty, value: FactValue): string {
  if (p.type === "list" && Array.isArray(value)) {
    if (p.itemType === "object") return `${value.length} item${value.length === 1 ? "" : "s"}`
    return value.map((v) => formatScalar((p.itemType ?? "text") as ScalarType, p, v)).join(", ") || "—"
  }
  if (p.type === "object") {
    const filled = Object.keys((value ?? {}) as object).length
    return `${filled} of ${(p.properties ?? []).length} filled`
  }
  return formatScalar(p.type as ScalarType, p, value)
}

export function formatElement(type: ListItemType, p: FactProperty, value: FactValue): string {
  return type === "object" ? "" : formatScalar(type, p, value)
}
