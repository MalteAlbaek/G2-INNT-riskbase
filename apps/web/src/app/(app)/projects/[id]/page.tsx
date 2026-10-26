import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProjectDetail } from "@/features/projects"
import { loadProject } from "@/features/projects/queries"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const project = await loadProject((await params).id)
  return { title: project ? `${project.name} · Riskbase` : "Project · Riskbase" }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await loadProject(id)
  if (!project) notFound()
  return <ProjectDetail project={project} />
}
