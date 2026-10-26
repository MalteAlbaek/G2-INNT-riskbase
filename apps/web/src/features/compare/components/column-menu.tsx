"use client"

import {
  IconArrowDown,
  IconArrowUp,
  IconChevronDown,
  IconEyeOff,
  IconInfoCircle,
  IconListDetails,
  IconPencil,
} from "@tabler/icons-react"
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
import type { TemplateField } from "@/features/screenings"
import { FACT_TYPE_LABEL, isScalarFact } from "@/features/templates/key-facts"
import type { SortState } from "../types"

/** Sort key for a key fact column: `fact:<fieldId>:<propertyKey>`. */
export const factSortKey = (fieldId: string, key: string) => `fact:${fieldId}:${key}`

interface ColumnMenuProps {
  field: TemplateField
  sort: SortState
  onSort: (key: string, dir: "asc" | "desc") => void
  onDetails: () => void
  onEdit: () => void
  onHide: () => void
}

export function ColumnMenu({ field, sort, onSort, onDetails, onEdit, onHide }: ColumnMenuProps) {
  const facts = field.keyFacts ?? []
  // Only plain values can be ordered; lists and objects can't.
  const sortableFacts = facts.filter((f) => isScalarFact(f) && f.type !== "boolean")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Options for ${field.name}`}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-popup-open:bg-accent data-popup-open:text-foreground"
          />
        }
      >
        <IconChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by score</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSort(field.id, "asc")}>
            <IconArrowUp />
            Lowest first
            {sort.key === field.id && sort.dir === "asc" && <Check />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort(field.id, "desc")}>
            <IconArrowDown />
            Highest first
            {sort.key === field.id && sort.dir === "desc" && <Check />}
          </DropdownMenuItem>
          {sortableFacts.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconListDetails />
                Sort by key fact
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-60">
                {sortableFacts.map((fact) => (
                  <DropdownMenuGroup key={fact.key}>
                    <DropdownMenuLabel className="flex items-center justify-between gap-2">
                      <span className="font-mono">{fact.key}</span>
                      <span className="font-normal">{FACT_TYPE_LABEL[fact.type]}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onSort(factSortKey(field.id, fact.key), "asc")}>
                      <IconArrowUp />
                      {fact.type === "number" ? "Lowest first" : fact.type === "date" ? "Earliest first" : "A → Z"}
                      {sort.key === factSortKey(field.id, fact.key) && sort.dir === "asc" && <Check />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSort(factSortKey(field.id, fact.key), "desc")}>
                      <IconArrowDown />
                      {fact.type === "number" ? "Highest first" : fact.type === "date" ? "Latest first" : "Z → A"}
                      {sort.key === factSortKey(field.id, fact.key) && sort.dir === "desc" && <Check />}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onDetails}>
            <IconInfoCircle />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <IconPencil />
            Edit criterion
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onHide}>
            <IconEyeOff />
            Hide column
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Check() {
  return <span className="ml-auto size-1.5 rounded-full bg-primary" aria-label="Active" />
}
