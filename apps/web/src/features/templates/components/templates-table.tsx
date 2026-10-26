"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconPencil,
  IconCopy,
  IconTrash,
  IconTemplate,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CountCell } from "@/components/ui/count-cell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteTemplate, duplicateTemplate } from "../actions"
import type { TemplateListItem } from "../types"
import { CreateTemplateSheet } from "./create-template-sheet"

export function TemplatesTable({ templates }: { templates: TemplateListItem[] }) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<TemplateListItem | null>(null)
  const [, startTransition] = useTransition()

  function duplicate(template: TemplateListItem) {
    startTransition(async () => {
      const result = await duplicateTemplate(template.id)
      if (!result.ok) setError(result.error)
      else router.push(`/templates/${result.value!.id}`)
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    const template = toDelete
    setToDelete(null)
    startTransition(async () => {
      const result = await deleteTemplate(template.id)
      if (!result.ok) setError(result.error)
      else router.refresh()
    })
  }
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      ),
    [search, templates]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length)

  function handleSearch(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handlePageSize(value: string | null) {
    if (!value) return
    setPageSize(Number(value))
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
          <span className="text-sm text-muted-foreground">
            {templates.length} templates
          </span>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <IconPlus className="size-4" />
          Add template
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg bg-score-n2-bg px-4 py-2.5 text-sm text-score-n2">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <Card className="py-0 gap-0">

        {/* Search — plain input to avoid component styling conflicts */}
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <IconSearch className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[380px]">Template</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead className="border-l border-border">Required</TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger
                    render={<span />}
                    className="cursor-help"
                  >
                    DB
                  </TooltipTrigger>
                  <TooltipContent>Dealbreaker criteria — scored -2 and flagged as a dealbreaker</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger
                    render={<span />}
                    className="cursor-help"
                  >
                    Gap fields
                  </TooltipTrigger>
                  <TooltipContent>Information gaps — criteria where the source material lacks sufficient content for extraction</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-64">
                  <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
                    <IconTemplate className="size-9 text-muted-foreground/30" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">
                        {search ? "No templates match your search" : "No templates yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "Try a different search term"
                          : "Create your first template to get started"}
                      </p>
                    </div>
                    {!search && (
                      <Button size="sm" onClick={() => setSheetOpen(true)}>
                        <IconPlus className="size-4" />
                        Add template
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((template) => (
                <TableRow
                  key={template.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/templates/${template.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.categories} dot="bg-muted-foreground/60" />
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.fields} dot="bg-muted-foreground/60" />
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <CountCell count={template.required} dot="bg-primary" />
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.db} dot="bg-indicator-db" />
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.gapFields} dot="bg-indicator-gap" />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Template actions" />
                        }
                      >
                        <IconDots className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/templates/${template.id}`)}>
                          <IconPencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate(template)}>
                          <IconCopy className="size-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={template.screenings > 0}
                          onClick={() => setToDelete(template)}
                        >
                          <IconTrash className="size-4" />
                          {template.screenings > 0 ? `Used by ${template.screenings} screening${template.screenings === 1 ? "" : "s"}` : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger size="sm" className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 25].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">
              {filtered.length === 0 ? "0" : `${rangeStart}–${rangeEnd}`} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

      </Card>

      <CreateTemplateSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{toDelete?.name}&rdquo; and all its categories and fields will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
