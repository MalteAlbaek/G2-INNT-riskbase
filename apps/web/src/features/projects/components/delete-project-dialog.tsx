"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { deleteProject } from "../actions"
import type { ProjectDetailData } from "../queries"

interface DeleteProjectDialogProps {
  project: ProjectDetailData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProjectDialog({ project, open, onOpenChange }: DeleteProjectDialogProps) {
  const router = useRouter()
  const [confirmName, setConfirmName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const matches = confirmName.trim() === project.name.trim()
  const reviewed = project.screenings.reduce((sum, s) => sum + s.reviewed, 0)
  const assessed = project.screenings.filter((s) => s.recommendation).length

  const consequences = [
    `${project.documents.length} document${project.documents.length === 1 ? "" : "s"} in the data room, including the files`,
    `${project.screenings.length} screening${project.screenings.length === 1 ? "" : "s"} with their AI results and evidence`,
    reviewed > 0 && `${reviewed} reviewed criteri${reviewed === 1 ? "on" : "a"} with rationale and history`,
    assessed > 0 && `${assessed} final assessment${assessed === 1 ? "" : "s"}`,
    "All comments and activity",
  ].filter(Boolean) as string[]

  function handleOpenChange(next: boolean) {
    if (pending) return
    if (!next) {
      setConfirmName("")
      setError(null)
    }
    onOpenChange(next)
  }

  function confirm() {
    setError(null)
    startTransition(async () => {
      const result = await deleteProject(project.id, confirmName)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push("/projects")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the project and everything in it. It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="flex flex-col gap-1.5 rounded-lg bg-destructive/5 px-4 py-3 text-sm">
          {consequences.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (matches && !pending) confirm()
          }}
        >
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor="confirm-project-name">
              Type <span className="font-semibold">{project.name}</span> to confirm
            </FieldLabel>
            <Input
              id="confirm-project-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoComplete="off"
              autoFocus
              aria-invalid={!!error || undefined}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
        </form>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!matches || pending} onClick={confirm}>
            {pending && <Spinner data-icon="inline-start" />}
            Delete project
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
