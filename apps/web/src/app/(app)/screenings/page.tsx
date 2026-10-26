"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconDots,
  IconEye,
  IconTrash,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CountCell } from "@/components/ui/count-cell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { RunScreeningSheet } from "@/features/screenings"

type ScreeningStatus = "Completed" | "In progress" | "Review" | "Draft"
type RiskLevel = "Low" | "Medium" | "High" | "Critical"

interface Screening {
  id: string
  project: string
  template: string
  status: ScreeningStatus
  risk: RiskLevel
  score: number
  dealbreakers: number
  gaps: number
  screenedAt: string
}

const screenings: Screening[] = [
  { id: "1", project: "Strommen 3A", template: "Miljø Screener", status: "Review", risk: "High", score: 38, dealbreakers: 3, gaps: 4, screenedAt: "2 Jun 2026, 09:45" },
  { id: "2", project: "Strommen 3A", template: "NCC Standard", status: "Completed", risk: "Medium", score: 61, dealbreakers: 1, gaps: 2, screenedAt: "28 May 2026, 14:20" },
  { id: "3", project: "Gartnerbyen – Rødovre", template: "Miljø Screener", status: "In progress", risk: "Medium", score: 54, dealbreakers: 2, gaps: 6, screenedAt: "28 Jan 2025, 10:00" },
  { id: "4", project: "Gartnerbyen – Rødovre", template: "NCC Standard", status: "Completed", risk: "Low", score: 78, dealbreakers: 0, gaps: 1, screenedAt: "15 Jan 2025, 09:30" },
  { id: "5", project: "Christiansvej – Glostrup", template: "NCC Standard", status: "Completed", risk: "Low", score: 82, dealbreakers: 0, gaps: 2, screenedAt: "15 Feb 2025, 11:00" },
  { id: "6", project: "Christiansvej – Glostrup", template: "Miljø Screener", status: "Completed", risk: "Medium", score: 65, dealbreakers: 1, gaps: 3, screenedAt: "3 Feb 2025, 11:30" },
  { id: "7", project: "Kærmindevej – Glostrup", template: "Miljø Screener", status: "Draft", risk: "Critical", score: 21, dealbreakers: 4, gaps: 7, screenedAt: "25 Feb 2025, 10:00" },
  { id: "8", project: "Kærmindevej – Glostrup", template: "NCC Standard", status: "Review", risk: "High", score: 44, dealbreakers: 2, gaps: 5, screenedAt: "10 Mar 2025, 09:15" },
]

const statusDot: Record<ScreeningStatus, string> = {
  Completed:    "bg-primary",
  "In progress": "bg-warning",
  Review:       "bg-warning",
  Draft:        "bg-muted-foreground",
}

const mautDot: Record<RiskLevel, string> = {
  Low:      "bg-success",
  Medium:   "bg-warning",
  High:     "bg-severe",
  Critical: "bg-destructive",
}

export default function ScreeningsPage() {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(
    () =>
      screenings.filter(
        (s) =>
          s.project.toLowerCase().includes(search.toLowerCase()) ||
          s.template.toLowerCase().includes(search.toLowerCase()) ||
          s.status.toLowerCase().includes(search.toLowerCase()) ||
          s.risk.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length)

  function handleSearch(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handlePageSize(value: string | null) {
    if (!value) return
    setPageSize(Number(value))
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-semibold text-foreground">Screenings</h1>
          <span className="text-sm text-muted-foreground">{screenings.length} screenings</span>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <IconPlus className="size-4" />
          Run screening
        </Button>
      </div>

      <Card className="py-0 gap-0">

        {/* Search */}
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <IconSearch className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search screenings…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[240px]">Project</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MAUT</TableHead>
              <TableHead className="border-l border-border">Dealbreakers</TableHead>
              <TableHead>Gaps</TableHead>
              <TableHead>Screened at</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-64">
                  <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">
                        {search ? "No screenings match your search" : "No screenings yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search ? "Try a different search term" : "Run your first screening to get started"}
                      </p>
                    </div>
                    {!search && (
                      <Button size="sm" onClick={() => setSheetOpen(true)}>
                        <IconPlus className="size-4" />
                        Run screening
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((screening) => (
                <TableRow
                  key={screening.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/screenings/${screening.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-foreground">{screening.project}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{screening.template}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1.5 rounded-md">
                      <span className={cn("size-1.5 rounded-[3px] shrink-0", statusDot[screening.status])} />
                      {screening.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1.5 rounded-md tabular-nums">
                      <span className={cn("size-1.5 rounded-[3px] shrink-0", mautDot[screening.risk])} />
                      {(screening.score / 100).toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="border-l border-border">
                    {screening.dealbreakers > 0 ? (
                      <CountCell count={screening.dealbreakers} dot="bg-indicator-db" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {screening.gaps > 0 ? (
                      <CountCell count={screening.gaps} dot="bg-indicator-gap" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{screening.screenedAt}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" aria-label="Screening actions" />}
                      >
                        <IconDots className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/screenings/${screening.id}`)}>
                          <IconEye className="size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <IconTrash className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger size="sm" className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 25].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">
              {filtered.length === 0 ? "0" : `${rangeStart}–${rangeEnd}`} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon-sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} aria-label="Previous page">
                <IconChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon-sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} aria-label="Next page">
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

      </Card>

      <RunScreeningSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
