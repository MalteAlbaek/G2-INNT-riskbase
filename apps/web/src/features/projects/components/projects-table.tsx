"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProjectListItem } from "../queries"
import { AddProjectSheet } from "./add-project-sheet"

export function ProjectsTable({ projects }: { projects: ProjectListItem[] }) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <IconPlus className="size-4" />
          Add project
        </Button>
      </div>

      <Card className="py-0 gap-0">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground">Add a project to start building its data room.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Screenings</TableHead>
                <TableHead>Last screened at</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">{project.documents}</TableCell>
                  <TableCell className="tabular-nums">{project.screenings}</TableCell>
                  <TableCell className="text-muted-foreground">{project.lastScreenedAt}</TableCell>
                  <TableCell className="text-muted-foreground">{project.createdAt}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${project.id}`)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddProjectSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
