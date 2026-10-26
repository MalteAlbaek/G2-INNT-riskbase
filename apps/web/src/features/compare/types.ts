import type { ProjectDocument } from "@/features/projects"

/** A file in the project's data room. */
export interface DataRoomDocument extends Omit<ProjectDocument, "markdown" | "fileUrl"> {
  /** Where the PDF can be loaded from (a static file today, storage later). */
  url: string
  addedBy?: string
}

/** The slice of a project record the comparison view needs (no document markdown). */
export interface CompareProject {
  id: string
  /** Owning organisation — the first folder of the project's storage paths. */
  orgId: string
  name: string
  documents: DataRoomDocument[]
}

/** What the document viewer is showing, and which passage to bring into view. */
export interface ViewerTarget {
  projectId: string
  screeningId: string
  documentName: string
  focus?: { page: number; quote: string }
}

export type SortKey = "project" | "scope" | (string & {})

export interface SortState {
  key: SortKey
  dir: "asc" | "desc"
}

/** Review progress for one screening across all of the template's criteria. */
export interface ReviewProgress {
  total: number
  reviewed: number
  open: number
}
