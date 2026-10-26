"use client"

import { useState, useTransition, type ComponentType, type DragEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconChevronLeft,
  IconClipboardList,
  IconFileText,
  IconLayoutColumns,
  IconMessageCircle,
  IconSparkles,
  IconTrash,
  IconUpload,
  IconChecklist,
  IconDots,
} from "@tabler/icons-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/ui/status-badge"
import { Textarea } from "@/components/ui/textarea"
import { RecommendationTag, ScoreMeter } from "@/features/compare/components/score-chip"
import type { ScreeningStatus } from "@/features/screenings"
import { cn } from "@/lib/utils"
import { addProjectComment, deleteDocument } from "../actions"
import type { ProjectActivityItem, ProjectDetailData, ProjectDocumentItem } from "../queries"
import { uploadDocuments } from "../upload"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { DocumentPreview } from "./document-preview"

const statusDot: Record<ScreeningStatus, string> = {
  Completed: "bg-primary",
  "In progress": "bg-warning",
  Review: "bg-warning",
  Draft: "bg-muted-foreground",
}

const activityIcon: Record<ProjectActivityItem["type"], ComponentType<{ className?: string }>> = {
  created: IconSparkles,
  upload: IconUpload,
  screening: IconClipboardList,
  assessment: IconChecklist,
  comment: IconMessageCircle,
}

function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export function ProjectDetail({ project }: { project: ProjectDetailData }) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<ProjectDocumentItem | null>(null)
  const [newComment, setNewComment] = useState("")
  const [posting, startPosting] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false)

  async function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return
    setError(null)
    setUploading(true)
    const { errors } = await uploadDocuments({ id: project.id, orgId: project.orgId }, files)
    setUploading(false)
    if (errors.length) setError(errors.join(" · "))
    router.refresh()
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(false)
    void addFiles(e.dataTransfer.files)
  }

  async function removeDocument(doc: ProjectDocumentItem) {
    setError(null)
    setDeletingId(doc.id)
    const result = await deleteDocument(doc.id)
    setDeletingId(null)
    if (!result.ok) setError(result.error)
    else router.refresh()
  }

  function postComment() {
    const body = newComment.trim()
    if (!body) return
    startPosting(async () => {
      const result = await addProjectComment(project.id, body)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setNewComment("")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <IconChevronLeft className="size-3.5" />
          Back
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <StatusBadge status={project.status} />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Project actions" className="ml-auto" />}>
              <IconDots />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteProjectOpen(true)}>
                  <IconTrash />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="text-sm text-muted-foreground">Created {project.createdAt}</span>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg bg-score-n2-bg px-4 py-2.5 text-sm text-score-n2">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Documents */}
        <Card className="py-0 gap-0 overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Data room</span>
            <span className="text-xs text-muted-foreground">
              {project.documents.length} file{project.documents.length !== 1 && "s"}
            </span>
          </div>

          <div className="p-5 border-b border-border">
            <label
              htmlFor="document-upload"
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              {uploading ? <Spinner className="size-6" /> : <IconUpload className="size-6 text-muted-foreground" />}
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {uploading ? "Uploading…" : "Click to upload or drag and drop"}
                </span>
                <span className="text-xs text-muted-foreground">PDF documents</span>
              </div>
              <input
                id="document-upload"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void addFiles(e.target.files)
                  e.target.value = ""
                }}
              />
            </label>
          </div>

          {project.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground">Upload the first document to get started</p>
            </div>
          ) : (
            <ul>
              {project.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-start justify-between gap-4 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-start gap-3 min-w-0 text-left"
                  >
                    <IconFileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="flex flex-col min-w-0 gap-0.5">
                      <span className="text-sm font-medium text-foreground truncate hover:underline">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.size} · Uploaded {doc.uploadedAt}
                        {doc.uploadedBy && ` by ${doc.uploadedBy}`}
                      </span>
                      <span className="text-xs leading-snug text-muted-foreground mt-1 line-clamp-2">
                        {doc.description ?? "Not parsed yet — description and Markdown appear once the document is processed."}
                      </span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.usedInScreenings > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        In {doc.usedInScreenings} screening{doc.usedInScreenings !== 1 && "s"}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${doc.name}`}
                      title={doc.usedInScreenings > 0 ? "Part of a screening — can't be deleted" : "Delete document"}
                      disabled={doc.usedInScreenings > 0 || deletingId === doc.id}
                      onClick={() => removeDocument(doc)}
                    >
                      {deletingId === doc.id ? <Spinner /> : <IconTrash className="size-4" />}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Screenings */}
        <Card className="py-0 gap-0 overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Screenings</span>
            <span className="text-xs text-muted-foreground">{project.screenings.length}</span>
          </div>
          {project.screenings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">No screenings yet</p>
            </div>
          ) : (
            <ul>
              {project.screenings.map((screening) => (
                <li key={screening.id} className="flex flex-col gap-2 px-5 py-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{screening.template}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                      {screening.score === null ? "—" : screening.score.toFixed(2)}
                    </span>
                  </div>
                  <ScoreMeter value={screening.score} />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="gap-1.5 rounded-md text-xs py-0">
                      <span className={cn("size-1.5 rounded-[3px] shrink-0", statusDot[screening.status])} />
                      {screening.status}
                    </Badge>
                    {screening.recommendation && <RecommendationTag value={screening.recommendation} />}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {screening.reviewed}/{screening.total} reviewed
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{screening.screenedAt}</span>
                    {screening.templateId && (
                      <Link
                        href={`/compare?template=${screening.templateId}`}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <IconLayoutColumns className="size-3.5" />
                        Review in Compare
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Activity */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">Activity</span>
          <span className="text-xs text-muted-foreground">
            {project.activity.length} update{project.activity.length !== 1 && "s"}
          </span>
        </div>

        <div className="flex gap-3 px-5 py-4 border-b border-border">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">{initials(project.currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment()
              }}
              placeholder="Write an update or comment…"
              rows={2}
              className="min-h-16 resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={postComment} disabled={!newComment.trim() || posting}>
                {posting && <Spinner data-icon="inline-start" />}
                Post
              </Button>
            </div>
          </div>
        </div>

        <ul className="flex flex-col px-5 pb-1">
          {[...project.activity].reverse().map((item, idx, feed) => {
            const Icon = activityIcon[item.type]
            const isLast = idx === feed.length - 1
            return (
              <li key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-3">
                  <span className="flex items-center justify-center size-6 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Icon className="size-3.5" />
                  </span>
                  {!isLast && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className={cn("flex-1 min-w-0 pt-3", isLast ? "pb-3" : "pb-5")}>
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{item.actor}</span>{" "}
                    <span className="text-muted-foreground">{item.message}</span>
                  </p>
                  {item.body && (
                    <div className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">
                      {item.body}
                    </div>
                  )}
                  <span className="mt-1 block text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <DeleteProjectDialog project={project} open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen} />

      {previewDoc && <DocumentPreview key={previewDoc.id} document={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}
