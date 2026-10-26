"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { saveDocumentMarkdown } from "../actions"
import type { ProjectDocumentItem } from "../queries"

// Minimal line-based renderer — enough for headings and paragraphs in parsed extractions.
function MarkdownView({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm text-foreground leading-relaxed">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <h4 key={i} className="font-semibold mt-2">{line.slice(4)}</h4>
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-semibold mt-3">{line.slice(3)}</h3>
        if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-semibold">{line.slice(2)}</h2>
        if (line.trim() === "") return <div key={i} className="h-1" />
        return <p key={i} className="text-foreground/80">{line}</p>
      })}
    </div>
  )
}

type MarkdownState = { status: "loading" } | { status: "missing" } | { status: "ready"; saved: string }

export function DocumentPreview({ document, onClose }: { document: ProjectDocumentItem; onClose: () => void }) {
  const [markdown, setMarkdown] = useState<MarkdownState>({ status: "loading" })
  const [draft, setDraft] = useState("")
  const [tab, setTab] = useState<"preview" | "edit">("preview")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/documents/${document.id}/markdown`)
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setMarkdown({ status: "missing" })
          return
        }
        const text = await res.text()
        if (cancelled) return
        setMarkdown({ status: "ready", saved: text })
        setDraft(text)
      })
      .catch(() => !cancelled && setMarkdown({ status: "missing" }))
    return () => {
      cancelled = true
    }
  }, [document.id])

  const dirty = markdown.status === "ready" && draft !== markdown.saved

  async function save() {
    setSaving(true)
    setError(null)
    const result = await saveDocumentMarkdown(document.id, draft)
    setSaving(false)
    if (!result.ok) setError(result.error)
    else setMarkdown({ status: "ready", saved: draft })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col w-[95vw] max-w-6xl h-[85vh] p-0 gap-0 sm:max-w-6xl">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="truncate">{document.name}</DialogTitle>
          <DialogDescription>Original file next to its Markdown extraction</DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 min-h-0 grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="flex flex-col min-h-0 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 shrink-0">
              Original
            </span>
            <iframe
              src={`/api/documents/${document.id}`}
              title={`${document.name} preview`}
              className="w-full flex-1 rounded-md border border-border bg-muted"
            />
          </div>

          <div className="flex flex-col min-h-0 p-4">
            {markdown.status === "loading" && (
              <div className="flex flex-1 items-center justify-center">
                <Spinner />
              </div>
            )}

            {markdown.status === "missing" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-6 text-center">
                <p className="text-sm font-medium">No Markdown extraction yet</p>
                <p className="text-xs text-muted-foreground">
                  It appears here once the document has been parsed, and can then be reviewed and corrected.
                </p>
              </div>
            )}

            {markdown.status === "ready" && (
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "preview" | "edit")}
                className="flex flex-1 min-h-0 flex-col gap-2"
              >
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Markdown
                  </span>
                  <TabsList variant="line">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="preview" className="min-h-0 overflow-y-auto pr-1">
                  <MarkdownView content={draft} />
                </TabsContent>
                <TabsContent value="edit" className="flex min-h-0 flex-col">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    spellCheck={false}
                    className="h-full field-sizing-fixed resize-none font-mono text-xs leading-relaxed"
                  />
                </TabsContent>
                <div className="flex items-center justify-between border-t border-border pt-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {error ?? (dirty ? "Unsaved changes" : "")}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={() => setDraft(markdown.saved)}>
                      Reset
                    </Button>
                    <Button size="sm" disabled={!dirty || saving} onClick={save}>
                      {saving && <Spinner data-icon="inline-start" />}
                      Save
                    </Button>
                  </div>
                </div>
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
