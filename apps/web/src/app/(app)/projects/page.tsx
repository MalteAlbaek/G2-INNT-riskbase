import type { Metadata } from "next"
import { ProjectsTable } from "@/features/projects"
import { listProjects } from "@/features/projects/queries"

export const metadata: Metadata = {
  title: "Projects · Riskbase",
}

export default async function ProjectsPage() {
  const projects = await listProjects()
  return <ProjectsTable projects={projects} />
}
