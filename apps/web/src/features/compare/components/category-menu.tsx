"use client"

import {
  IconArrowDown,
  IconArrowUp,
  IconChevronDown,
  IconEyeOff,
  IconFilter,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPencil,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TemplateCategory } from "@/features/screenings"
import type { SortState } from "../types"

export const categorySortKey = (categoryId: string) => `cat:${categoryId}`

interface CategoryMenuProps {
  category: TemplateCategory
  sort: SortState
  collapsed: boolean
  onSort: (dir: "asc" | "desc") => void
  onToggleCollapsed: () => void
  onShowOnly: () => void
  onHide: () => void
  onEdit: () => void
}

export function CategoryMenu({
  category,
  sort,
  collapsed,
  onSort,
  onToggleCollapsed,
  onShowOnly,
  onHide,
  onEdit,
}: CategoryMenuProps) {
  const sorted = sort.key === categorySortKey(category.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Options for ${category.name}`}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground data-popup-open:bg-background/60 data-popup-open:text-foreground"
          />
        }
      >
        <IconChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by category score</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSort("asc")}>
            <IconArrowUp />
            Lowest first
            {sorted && sort.dir === "asc" && <ActiveDot />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("desc")}>
            <IconArrowDown />
            Highest first
            {sorted && sort.dir === "desc" && <ActiveDot />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onToggleCollapsed}>
            {collapsed ? <IconLayoutSidebarLeftExpand /> : <IconLayoutSidebarLeftCollapse />}
            {collapsed ? "Expand criteria" : "Collapse to summary"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShowOnly}>
            <IconFilter />
            Show only this category
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onHide}>
            <IconEyeOff />
            Hide category
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onEdit}>
            <IconPencil />
            Edit category
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActiveDot() {
  return <span className="ml-auto size-1.5 rounded-full bg-primary" aria-label="Active" />
}
