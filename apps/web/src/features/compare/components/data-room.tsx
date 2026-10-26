"use client"

import { useState, type DragEvent } from "react"
import { IconFileText, IconUpload } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { DataRoomDocument } from "../types"

interface DataRoomProps {
  documents: DataRoomDocument[]
  /** documentName → number of criteria citing it */
  citedBy: Record<string, number>
  onUpload: (files: File[]) => void
  onOpen: (documentName: string) => void
}

export function DataRoom({ documents, citedBy, onUpload, onOpen }: DataRoomProps) {
  const [dragging, setDragging] = useState(false)

  function accept(list: FileList | null) {
    const pdfs = Array.from(list ?? []).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    if (pdfs.length) onUpload(pdfs)
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    accept(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-5">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:bg-accent",
          dragging && "border-primary bg-accent"
        )}
      >
        <IconUpload className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium">Upload documents</span>
        <span className="text-xs text-muted-foreground">PDF — drag files here or click to browse</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            accept(e.target.files)
            e.target.value = ""
          }}
        />
      </label>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">
          Documents <span className="font-normal text-muted-foreground">· {documents.length}</span>
        </h3>
        <ul className="flex flex-col">
          {documents.map((doc) => {
            const cited = citedBy[doc.name] ?? 0
            return (
              <li key={doc.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => onOpen(doc.name)}
                  className="-mx-2 flex w-[calc(100%+1rem)] gap-3 rounded-md px-2 py-2.5 text-left hover:bg-accent"
                >
                  <IconFileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{doc.name}</span>
                    {doc.description && (
                      <span className="line-clamp-2 text-xs leading-relaxed text-foreground/75">{doc.description}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {doc.size} · {doc.uploadedAt}
                      {doc.addedBy && ` · ${doc.addedBy}`}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 self-start rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                      cited ? "bg-accent text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {cited ? `Cited by ${cited}` : "Not cited"}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
