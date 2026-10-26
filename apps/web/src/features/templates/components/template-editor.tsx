"use client"

import { useOptimistic, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  IconPlus,
  IconChevronLeft,
  IconDots,
  IconPencil,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconTable,
} from "@tabler/icons-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  createCategory,
  createField,
  deleteCategory,
  deleteField,
  duplicateTemplate,
  moveCategory as moveCategoryAction,
  moveField as moveFieldAction,
  updateCategory,
  updateField,
  updateTemplate,
  type FieldInput,
} from "../actions"
import type { TemplateCategoryConfig, TemplateConfig, TemplateFieldConfig } from "../types"
import { CreateCategorySheet, type CategoryFormData } from "./create-category-sheet"
import { CreateFieldSheet } from "./create-field-sheet"
import { FieldDetailsPanel, SectionLabel } from "./field-details-form"

type Field = TemplateFieldConfig
type Category = TemplateCategoryConfig
type Result = { ok: boolean; error?: string }


export function TemplateEditor({ template: savedTemplate }: { template: TemplateConfig }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Edits show immediately; the server's version takes over once the write lands.
  const [template, applyOptimistic] = useOptimistic(
    savedTemplate,
    (state: TemplateConfig, update: (t: TemplateConfig) => TemplateConfig) => update(state)
  )
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(savedTemplate.name)
  const [isDirty, setIsDirty] = useState(false)
  const [pendingNav, setPendingNav] = useState<{ categoryId: string; fieldId?: string } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ type: "category" | "field"; id: string; name: string } | null>(null)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | undefined>(undefined)
  const [createFieldOpen, setCreateFieldOpen] = useState(false)

  function mutate(update: (t: TemplateConfig) => TemplateConfig, write: () => Promise<Result>) {
    startTransition(async () => {
      applyOptimistic(update)
      const result = await write()
      if (!result.ok) setError(result.error ?? "Could not save")
      router.refresh()
    })
  }

  function saveName() {
    setEditingName(false)
    const name = nameDraft.trim()
    if (!name || name === template.name) {
      setNameDraft(template.name)
      return
    }
    mutate((t) => ({ ...t, name }), () => updateTemplate(template.id, { name }))
  }

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateTemplate(template.id)
      if (!result.ok) setError(result.error)
      else router.push(`/templates/${result.value!.id}`)
    })
  }

  const selectedCategoryId = searchParams.get("category") ?? template.categories[0]?.id
  const selectedFieldId = searchParams.get("field") ?? null
  const selectedCategory = template.categories.find((c) => c.id === selectedCategoryId) ?? template.categories[0]
  const selectedField = selectedCategory?.fields.find((f) => f.id === selectedFieldId) ?? null

  function doNavigate(categoryId: string, fieldId?: string) {
    setIsDirty(false)
    const params = new URLSearchParams()
    params.set("category", categoryId)
    if (fieldId) params.set("field", fieldId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function tryNavigate(categoryId: string, fieldId?: string) {
    if (isDirty && selectedFieldId) {
      setPendingNav({ categoryId, fieldId })
      return
    }
    doNavigate(categoryId, fieldId)
  }

  function moveCategory(id: string, dir: "up" | "down") {
    mutate(
      (t) => {
        const cats = [...t.categories]
        const idx = cats.findIndex((c) => c.id === id)
        const newIdx = dir === "up" ? idx - 1 : idx + 1
        if (newIdx < 0 || newIdx >= cats.length) return t
        ;[cats[idx], cats[newIdx]] = [cats[newIdx]!, cats[idx]!]
        return { ...t, categories: cats }
      },
      () => moveCategoryAction(template.id, id, dir)
    )
  }

  function moveField(catId: string, fieldId: string, dir: "up" | "down") {
    mutate(
      (t) => ({
        ...t,
        categories: t.categories.map((cat) => {
          if (cat.id !== catId) return cat
          const fields = [...cat.fields]
          const idx = fields.findIndex((f) => f.id === fieldId)
          const newIdx = dir === "up" ? idx - 1 : idx + 1
          if (newIdx < 0 || newIdx >= fields.length) return cat
          ;[fields[idx], fields[newIdx]] = [fields[newIdx]!, fields[idx]!]
          return { ...cat, fields }
        }),
      }),
      () => moveFieldAction(template.id, catId, fieldId, dir)
    )
  }

  function confirmDelete() {
    if (!deleteDialog) return
    const { type, id } = deleteDialog
    if (type === "category") {
      const remaining = template.categories.filter((c) => c.id !== id)
      if (selectedCategory?.id === id) {
        const target = remaining[0]
        router.push(target ? `?category=${target.id}` : "?", { scroll: false })
      }
      mutate((t) => ({ ...t, categories: t.categories.filter((c) => c.id !== id) }), () => deleteCategory(template.id, id))
    } else {
      if (selectedFieldId === id) {
        router.push(`?category=${selectedCategoryId}`, { scroll: false })
        setIsDirty(false)
      }
      mutate(
        (t) => ({ ...t, categories: t.categories.map((cat) => ({ ...cat, fields: cat.fields.filter((f) => f.id !== id) })) }),
        () => deleteField(template.id, id)
      )
    }
    setDeleteDialog(null)
  }

  function handleCategorySave(data: CategoryFormData) {
    const input = { name: data.name, weight: data.weight / 100, description: data.description }
    if (data.id) {
      const id = data.id
      mutate(
        (t) => ({ ...t, categories: t.categories.map((c) => (c.id === id ? { ...c, ...input } : c)) }),
        () => updateCategory(template.id, id, input)
      )
      return
    }
    startTransition(async () => {
      const result = await createCategory(template.id, input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`?category=${result.value!.id}`, { scroll: false })
      router.refresh()
    })
  }

  function handleFieldCreate(categoryId: string, input: FieldInput) {
    startTransition(async () => {
      const result = await createField(template.id, categoryId, input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`?category=${categoryId}&field=${result.value!.id}`, { scroll: false })
      router.refresh()
    })
  }

  function handleFieldSave(updated: Field) {
    const input: FieldInput = {
      name: updated.name,
      weight: updated.weight,
      required: updated.required,
      dealbreaker: updated.dealbreaker,
      extractionPrompt: updated.extractionPrompt,
      gapInstruction: updated.gapInstruction,
      keyFacts: updated.keyFacts,
    }
    mutate(
      (t) => ({
        ...t,
        categories: t.categories.map((cat) => ({
          ...cat,
          fields: cat.fields.map((f) => (f.id === updated.id ? updated : f)),
        })),
      }),
      () => updateField(template.id, updated.id, input)
    )
    setIsDirty(false)
  }

  function openCreateCategory() {
    setEditingCategory(undefined)
    setCategorySheetOpen(true)
  }

  function openEditCategory(cat: Category) {
    setEditingCategory({ id: cat.id, name: cat.name, weight: Math.round(cat.weight * 100), description: cat.description })
    setCategorySheetOpen(true)
  }

  const dbCount = (cat: Category) => cat.fields.filter((f) => f.dealbreaker).length

  const catRefs = useRef<(HTMLButtonElement | null)[]>([])
  const fieldRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleCatKeyDown(e: React.KeyboardEvent, idx: number) {
    const len = template.categories.length
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = (idx + 1) % len
      catRefs.current[next]?.focus()
      tryNavigate(template.categories[next].id)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = (idx - 1 + len) % len
      catRefs.current[prev]?.focus()
      tryNavigate(template.categories[prev].id)
    }
  }

  function handleFieldKeyDown(e: React.KeyboardEvent, idx: number) {
    const fields = selectedCategory?.fields ?? []
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = (idx + 1) % fields.length
      fieldRefs.current[next]?.focus()
      tryNavigate(selectedCategoryId!, fields[next].id)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = (idx - 1 + fields.length) % fields.length
      fieldRefs.current[prev]?.focus()
      tryNavigate(selectedCategoryId!, fields[prev].id)
    }
  }

  return (
    <div className="flex flex-col flex-1 p-8 gap-5 overflow-hidden h-full">

      {/* Page header */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between">
          <Link
            href="/templates"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <IconChevronLeft className="size-3.5" />
            Back
          </Link>
          <Link
            href={`/compare?template=${template.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconTable className="size-3.5" />
            Screenings
          </Link>
        </div>
        {editingName ? (
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName()
              if (e.key === "Escape") {
                setNameDraft(template.name)
                setEditingName(false)
              }
            }}
            className="text-2xl font-semibold bg-transparent outline-none border-b border-primary w-full max-w-sm"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setNameDraft(template.name)
              setEditingName(true)
            }}
            title="Click to rename"
            className="text-2xl font-semibold text-foreground hover:text-foreground/70 transition-colors text-left w-fit"
          >
            {template.name}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="flex shrink-0 items-center gap-3 rounded-lg bg-score-n2-bg px-4 py-2.5 text-sm text-score-n2">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {template.screeningCount > 0 && (
        <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex-1 text-foreground/80">
            Used by {template.screeningCount} screening{template.screeningCount === 1 ? "" : "s"}. Texts and weights can be
            edited, and changes apply to those screenings&apos; scores. Criteria with results can&apos;t be deleted —
            duplicate the template to make a new version.
          </span>
          <Button variant="outline" size="sm" onClick={duplicate}>
            Duplicate
          </Button>
        </div>
      )}

      {/* Three-column editor */}
      <div className="flex flex-1 min-h-0 rounded-xl border border-border overflow-hidden">

        {/* Column 1 — Categories */}
        <div className="w-[270px] shrink-0 flex flex-col border-r border-border bg-muted/40">
          <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0 bg-muted/40">
            <SectionLabel>Categories</SectionLabel>
            <Button variant="ghost" size="icon-sm" aria-label="Add category" onClick={openCreateCategory}>
              <IconPlus className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 p-2">
            {template.categories.map((cat, idx) => {
              const isSelected = cat.id === selectedCategory?.id
              const db = dbCount(cat)
              return (
                <div key={cat.id} className="group/cat relative">
                  <button
                    ref={(el) => { catRefs.current[idx] = el }}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => tryNavigate(cat.id)}
                    onKeyDown={(e) => handleCatKeyDown(e, idx)}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors w-full pr-8",
                      isSelected ? "bg-muted border border-border" : "hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("text-sm font-medium truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-primary tabular-nums">{cat.weight}</span>
                      <span className="text-xs text-muted-foreground">{cat.fields.length} fields</span>
                      {db > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="size-1.5 rounded-[3px] bg-indicator-db shrink-0" />
                          {db} DB
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" aria-label="Category actions" className="hover:bg-foreground/8 dark:hover:bg-foreground/10" />}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <IconDots className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                          <IconPencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={idx === 0}
                          onClick={() => moveCategory(cat.id, "up")}
                        >
                          <IconChevronUp className="size-4" />
                          Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={idx === template.categories.length - 1}
                          onClick={() => moveCategory(cat.id, "down")}
                        >
                          <IconChevronDown className="size-4" />
                          Move down
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={cat.fields.some((f) => f.inUse)}
                          onClick={() => setDeleteDialog({ type: "category", id: cat.id, name: cat.name })}
                        >
                          <IconTrash className="size-4" />
                          {cat.fields.some((f) => f.inUse) ? "Has screening results" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Column 2 — Fields */}
        <div className="w-[370px] shrink-0 flex flex-col border-r border-border">
          <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{selectedCategory?.name}</span>
              {selectedCategory && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {selectedCategory.fields.length} fields
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Add field" onClick={() => setCreateFieldOpen(true)}>
              <IconPlus className="size-4 shrink-0" />
            </Button>
          </div>

          {selectedCategory?.fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
              <p className="text-sm font-medium text-foreground">No fields yet</p>
              <p className="text-sm text-muted-foreground">Add the first field to this category</p>
              <Button size="sm" onClick={() => setCreateFieldOpen(true)}>
                <IconPlus className="size-4" />
                Add field
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 p-2">
              {selectedCategory?.fields.map((field, idx) => {
                const isSelected = field.id === selectedField?.id
                const isThisDirty = isDirty && isSelected
                return (
                  <div key={field.id} className="group/field relative">
                    <button
                      ref={(el) => { fieldRefs.current[idx] = el }}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => tryNavigate(selectedCategoryId!, field.id)}
                      onKeyDown={(e) => handleFieldKeyDown(e, idx)}
                      className={cn(
                        "flex items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors w-full pr-8",
                        isSelected ? "bg-muted border border-border" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-sm font-medium truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
                            {field.name}
                          </span>
                          {isThisDirty && (
                            <span className="size-1.5 rounded-full bg-primary shrink-0" title="Unsaved changes" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-primary tabular-nums">{field.weight}</span>
                          {field.required && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 font-medium">required</Badge>
                          )}
                          {field.dealbreaker && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 font-medium">dealbreaker</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 pt-0.5 shrink-0">
                        {field.dealbreaker && <span className="size-2 rounded-[3px] bg-indicator-db shrink-0" />}
                        {field.gapInstruction && <span className="size-2 rounded-[3px] bg-indicator-gap shrink-0" />}
                      </div>
                    </button>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label="Field actions" className="hover:bg-foreground/8 dark:hover:bg-foreground/10" />}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <IconDots className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => tryNavigate(selectedCategoryId!, field.id)}>
                            <IconPencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={idx === 0}
                            onClick={() => moveField(selectedCategoryId!, field.id, "up")}
                          >
                            <IconChevronUp className="size-4" />
                            Move up
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={idx === (selectedCategory?.fields.length ?? 0) - 1}
                            onClick={() => moveField(selectedCategoryId!, field.id, "down")}
                          >
                            <IconChevronDown className="size-4" />
                            Move down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={field.inUse}
                            onClick={() => setDeleteDialog({ type: "field", id: field.id, name: field.name })}
                          >
                            <IconTrash className="size-4" />
                            {field.inUse ? "Has screening results" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Column 3 — Field details */}
        <div className="flex flex-col flex-1 min-w-0 bg-muted/40">
          <div className="flex items-center px-6 h-11 border-b border-border shrink-0 bg-muted/40">
            <SectionLabel>Field details</SectionLabel>
          </div>
          {selectedField ? (
            <FieldDetailsPanel
              key={selectedField.id}
              field={selectedField}
              onDirtyChange={setIsDirty}
              onCancel={() => tryNavigate(selectedCategoryId!)}
              onSave={handleFieldSave}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center px-8">
              <p className="text-sm font-medium text-foreground">No field selected</p>
              <p className="text-sm text-muted-foreground">Select a field to view and edit its details</p>
            </div>
          )}
        </div>

      </div>

      {/* Discard changes dialog */}
      <AlertDialog open={!!pendingNav} onOpenChange={(open) => { if (!open) setPendingNav(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this field. They will be lost if you navigate away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingNav) doNavigate(pendingNav.categoryId, pendingNav.fieldId)
                setPendingNav(null)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog?.type === "category" ? "category" : "field"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === "category"
                ? `"${deleteDialog?.name}" and all its fields will be permanently deleted.`
                : `"${deleteDialog?.name}" will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateCategorySheet
        key={`${editingCategory?.id ?? "new"}-${categorySheetOpen}`}
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        initialData={editingCategory}
        onSave={handleCategorySave}
      />

      <CreateFieldSheet
        open={createFieldOpen}
        onOpenChange={setCreateFieldOpen}
        categories={template.categories}
        defaultCategoryId={selectedCategory?.id}
        onCreate={handleFieldCreate}
      />
    </div>
  )
}
