"use client"

import { useState, type ComponentProps, type PointerEvent as ReactPointerEvent } from "react"
import { SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/**
 * Side panels come in two variants built on the same resizable shell:
 * - `SidePanel` docks next to the page, which stays usable (e.g. reviewing beside the Compare grid).
 * - `ResizableSheetContent` overlays the page for a focused task (create / edit forms).
 * Both are resized by dragging their left edge; the width is remembered per panel `id`.
 */

const MIN_WIDTH = 320
const maxWidth = () => Math.min(1100, Math.round(window.innerWidth * 0.8))
const storageKey = (id: string) => `riskbase:panel-width:${id}`

function readWidth(id: string, fallback: number) {
  try {
    const saved = Number(window.localStorage.getItem(storageKey(id)))
    return saved >= MIN_WIDTH ? Math.min(saved, maxWidth()) : fallback
  } catch {
    return fallback
  }
}

function useResizableWidth(id: string, defaultWidth: number) {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? defaultWidth : readWidth(id, defaultWidth)))
  const [drag, setDrag] = useState<{ startX: number; startWidth: number } | null>(null)

  const handleProps = {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrag({ startX: e.clientX, startWidth: width })
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag) return
      // The handle sits on the left edge, so dragging left widens the panel.
      setWidth(Math.min(maxWidth(), Math.max(MIN_WIDTH, drag.startWidth + drag.startX - e.clientX)))
    },
    onPointerUp: () => {
      setDrag(null)
      try {
        window.localStorage.setItem(storageKey(id), String(width))
      } catch {
        // Width just won't be remembered.
      }
    },
    onDoubleClick: () => setWidth(defaultWidth),
  }

  return { width, resizing: drag !== null, handleProps }
}

function ResizeHandle({ resizing, ...props }: { resizing: boolean } & ReturnType<typeof useResizableWidth>["handleProps"]) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      title="Drag to resize · double-click to reset"
      className="group/resize absolute inset-y-0 left-0 z-10 w-2 -translate-x-1 cursor-col-resize touch-none"
      {...props}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resize:bg-primary/50",
          resizing && "bg-primary"
        )}
      />
    </div>
  )
}

/** Docked side panel — the page beside it stays interactive. */
export function SidePanel({
  id,
  defaultWidth = 440,
  className,
  children,
  ...props
}: { id: string; defaultWidth?: number } & ComponentProps<"aside">) {
  const { width, resizing, handleProps } = useResizableWidth(id, defaultWidth)
  return (
    <aside
      {...props}
      style={{ width }}
      className={cn("relative flex shrink-0 flex-col border-l border-border bg-background", resizing && "select-none", className)}
    >
      <ResizeHandle resizing={resizing} {...handleProps} />
      {children}
    </aside>
  )
}

/** Overlay side panel (Sheet) with the same resizable left edge. Use inside <Sheet>. */
export function ResizableSheetContent({
  id,
  defaultWidth = 560,
  className,
  children,
  ...props
}: { id: string; defaultWidth?: number } & ComponentProps<typeof SheetContent>) {
  const { width, resizing, handleProps } = useResizableWidth(id, defaultWidth)
  return (
    <SheetContent
      side="right"
      {...props}
      style={{ width, maxWidth: "none" }}
      className={cn("flex flex-col gap-0 p-0 sm:max-w-none", resizing && "select-none", className)}
    >
      <ResizeHandle resizing={resizing} {...handleProps} />
      {children}
    </SheetContent>
  )
}
