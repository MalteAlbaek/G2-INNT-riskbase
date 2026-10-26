import type { FactProperty } from "./key-facts"

export interface TemplateFieldConfig {
  id: string
  name: string
  /** 0…1 */
  weight: number
  required: boolean
  dealbreaker: boolean
  extractionPrompt: string
  gapInstruction: string
  keyFacts: FactProperty[]
  /** Has screening results — can be edited but not deleted. */
  inUse: boolean
}

export interface TemplateCategoryConfig {
  id: string
  name: string
  /** 0…1 */
  weight: number
  description: string
  fields: TemplateFieldConfig[]
}

export interface TemplateConfig {
  id: string
  name: string
  description: string
  screeningCount: number
  categories: TemplateCategoryConfig[]
}

export interface TemplateListItem {
  id: string
  name: string
  description: string
  categories: number
  fields: number
  required: number
  db: number
  gapFields: number
  screenings: number
}
