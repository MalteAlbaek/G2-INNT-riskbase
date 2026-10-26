"use client"

import { useEffect, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { IconQuote, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { SourceRef, TemplateField } from "@/features/screenings"
import { cn } from "@/lib/utils"
import type { DataRoomDocument } from "../types"

// Copied into public/ by scripts/copy-pdf-worker.mjs so it always matches react-pdf's pdf.js.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

const PAGE_WIDTH = 680

export interface Citation {
  fieldId: string
  fieldName: string
  source: SourceRef
}

interface DocumentViewerProps {
  documents: DataRoomDocument[]
  documentName: string
  focus?: { page: number; quote: string }
  citations: Citation[]
  fields: TemplateField[]
  onSelectDocument: (name: string) => void
  onCite: (fieldId: string, source: Pick<SourceRef, "documentName" | "page" | "quote">) => void
  onClose: () => void
}

export function DocumentViewer(props: DocumentViewerProps) {
  const { documents, documentName, citations, fields, onSelectDocument, onCite, onClose } = props
  const doc = documents.find((d) => d.name === documentName)

  const [numPages, setNumPages] = useState(0)
  const [focus, setFocus] = useState(props.focus)
  const [textByPage, setTextByPage] = useState<Record<number, string[]>>({})
  const [selection, setSelection] = useState<{ text: string; page: number } | null>(null)
  const [citeField, setCiteField] = useState<string | null>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const inDocument = citations.filter((c) => c.source.documentName === documentName)
  const byPage = new Map<number, Citation[]>()
  // Page 0 collects sources that only carry a free-text reference.
  for (const c of [...inDocument].sort((a, b) => (a.source.page ?? 0) - (b.source.page ?? 0))) {
    const page = c.source.page ?? 0
    byPage.set(page, [...(byPage.get(page) ?? []), c])
  }

  // Bring the focused passage into view once its page exists. Scrolling is a DOM side effect.
  useEffect(() => {
    if (!focus || !numPages) return
    pageRefs.current[focus.page]?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [focus, numPages])

  function highlighter(pageNumber: number) {
    const items = textByPage[pageNumber]
    if (!items) return undefined
    const marks = new Map<number, "active" | "cited">()
    for (const c of byPage.get(pageNumber) ?? []) {
      const active = focus?.page === pageNumber && focus.quote === c.source.quote
      for (const i of matchItems(items, c.source.quote)) {
        if (active || !marks.has(i)) marks.set(i, active ? "active" : "cited")
      }
    }
    return ({ str, itemIndex }: { str: string; itemIndex: number }) => {
      const kind = marks.get(itemIndex)
      if (!kind) return escapeHtml(str)
      const tone = kind === "active" ? "bg-primary/30 outline outline-2 outline-primary/50" : "bg-primary/12"
      return `<mark class="rounded-[2px] text-transparent ${tone}">${escapeHtml(str)}</mark>`
    }
  }

  function captureSelection() {
    const sel = window.getSelection()
    const text = sel?.toString().replace(/\s+/g, " ").trim() ?? ""
    const pageEl = sel?.anchorNode?.parentElement?.closest<HTMLElement>("[data-page-number]")
    if (text.length < 8 || !pageEl) return
    setSelection({ text, page: Number(pageEl.dataset.pageNumber) })
  }

  function cite() {
    if (!selection || !citeField) return
    onCite(citeField, { documentName, page: selection.page, quote: selection.text })
    setFocus({ page: selection.page, quote: selection.text })
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="flex h-[90vh] w-[95vw] max-w-7xl flex-col gap-0 p-0 sm:max-w-7xl">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
          <DialogTitle className="sr-only">{documentName}</DialogTitle>
          <Select
            items={documents.map((d) => ({ value: d.name, label: d.name }))}
            value={documentName}
            onValueChange={(v: string | null) => {
              if (v && v !== documentName) {
                setNumPages(0)
                setTextByPage({})
                setFocus(undefined)
                setSelection(null)
                onSelectDocument(v)
              }
            }}
          >
            <SelectTrigger size="sm" className="w-80" aria-label="Document">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {numPages > 0 && `${numPages} pages`}
            {doc?.addedBy && ` · uploaded by ${doc.addedBy}`}
          </span>
          <span className="ml-auto hidden text-xs text-muted-foreground md:block">
            Select text in the document to cite it as evidence
          </span>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <IconX />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* ── Pages ── */}
          <div className="min-w-0 flex-1 overflow-auto bg-muted px-6 py-6" onMouseUp={captureSelection}>
            {doc ? (
              <Document
                key={doc.url}
                file={doc.url}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                loading={<Centered><Spinner /></Centered>}
                error={<Centered>This document could not be opened.</Centered>}
                className="mx-auto flex w-fit flex-col gap-4"
              >
                {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                  <div
                    key={n}
                    ref={(el) => {
                      pageRefs.current[n] = el
                    }}
                    className="scroll-mt-6 overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-border"
                  >
                    <Page
                      pageNumber={n}
                      width={PAGE_WIDTH}
                      renderAnnotationLayer={false}
                      onGetTextSuccess={({ items }) =>
                        setTextByPage((prev) => ({ ...prev, [n]: items.map((it) => ("str" in it ? it.str : "")) }))
                      }
                      customTextRenderer={highlighter(n)}
                    />
                  </div>
                ))}
              </Document>
            ) : (
              <Centered>Document not found in the data room.</Centered>
            )}
          </div>

          {/* ── Evidence rail ── */}
          <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-background">
            {selection && (
              <div className="flex flex-col gap-2.5 border-b border-border bg-card p-4">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <IconQuote className="size-4" />
                  Cite as evidence
                </span>
                <q className="line-clamp-4 text-xs leading-relaxed text-foreground/80">{selection.text}</q>
                <span className="text-[11px] text-muted-foreground">Page {selection.page}</span>
                <Select
                  items={fields.map((f) => ({ value: f.id, label: f.name.replace(/­/g, "") }))}
                  value={citeField}
                  onValueChange={(v: string | null) => setCiteField(v)}
                >
                  <SelectTrigger size="sm" className="w-full" aria-label="Criterion">
                    <SelectValue placeholder="For criterion…" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name.replace(/­/g, "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelection(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={!citeField} onClick={cite}>
                    Add evidence
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold">Evidence in this document</h3>
              {inDocument.length === 0 ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Nothing in this document is cited yet. Select a passage to use it as evidence for a criterion.
                </p>
              ) : (
                [...byPage.entries()].map(([page, list]) => (
                  <div key={page} className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {page > 0 ? `Page ${page}` : "Page not specified"}
                    </span>
                    {list.map((c, i) => {
                      const active = focus?.page === Math.max(page, 1) && focus.quote === c.source.quote
                      return (
                        <button
                          key={`${c.fieldId}-${i}`}
                          type="button"
                          onClick={() => setFocus({ page: Math.max(page, 1), quote: c.source.quote })}
                          className={cn(
                            "flex flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent",
                            active ? "border-primary/50 bg-accent" : "border-border"
                          )}
                        >
                          <span className="text-xs font-medium">{c.fieldName.replace(/­/g, "")}</span>
                          <span className="line-clamp-2 text-xs leading-relaxed text-foreground/75">{c.source.quote}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {c.source.addedBy ? `Added by ${c.source.addedBy}` : "Cited by AI"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-64 w-[680px] items-center justify-center text-sm text-muted-foreground">{children}</div>
}

const normalize = (text: string) => text.replace(/­/g, "").replace(/\s+/g, " ").trim().toLowerCase()

/** Indices of the text items (≈ lines) a quote spans on a page. */
function matchItems(items: string[], quote: string): number[] {
  const q = normalize(quote)
  if (!q) return []
  let text = ""
  const spans = items.map((item) => {
    const start = text.length
    const norm = normalize(item)
    text += norm ? `${norm} ` : ""
    return { start, end: start + norm.length }
  })
  const at = text.indexOf(q)
  if (at < 0) return []
  const end = at + q.length
  return spans.flatMap((s, i) => (s.end > s.start && s.start < end && s.end > at ? [i] : []))
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
