"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconFolderOpen,
  IconClipboardList,
  IconAlertTriangle,
  IconSearch,
  IconArrowRight,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ─── Mock data ────────────────────────────────────────────────────────────────

type ScreeningStatus = "Completed" | "In progress" | "Review" | "Draft"
type RiskLevel = "Low" | "Medium" | "High" | "Critical"
type ProjectStatus = "Active" | "Review"

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

interface Project {
  id: string
  name: string
  status: ProjectStatus
  documents: number
  lastScreenedAt: string
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

const projects: Project[] = [
  { id: "1", name: "Strommen 3A", status: "Review", documents: 3, lastScreenedAt: "2 Jun 2026, 09:45" },
  { id: "2", name: "Gartnerbyen – Rødovre", status: "Active", documents: 5, lastScreenedAt: "28 Jan 2025, 10:00" },
  { id: "3", name: "Christiansvej – Glostrup", status: "Active", documents: 3, lastScreenedAt: "15 Feb 2025, 11:00" },
  { id: "4", name: "Kærmindevej – Glostrup", status: "Review", documents: 4, lastScreenedAt: "25 Feb 2025, 10:00" },
]

const statusDot: Record<ScreeningStatus, string> = {
  Completed: "bg-primary",
  "In progress": "bg-warning",
  Review: "bg-warning",
  Draft: "bg-muted-foreground",
}

const RISK_LEVELS: { level: RiskLevel; dot: string }[] = [
  { level: "Low", dot: "bg-success" },
  { level: "Medium", dot: "bg-warning" },
  { level: "High", dot: "bg-severe" },
  { level: "Critical", dot: "bg-destructive" },
]

const riskDot: Record<RiskLevel, string> = Object.fromEntries(
  RISK_LEVELS.map(({ level, dot }) => [level, dot])
) as Record<RiskLevel, string>

// ─── Derived stats ──────────────────────────────────────────────────────────────

const totalDealbreakers = screenings.reduce((sum, s) => sum + s.dealbreakers, 0)
const totalGaps = screenings.reduce((sum, s) => sum + s.gaps, 0)

const riskCounts: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 }
for (const s of screenings) riskCounts[s.risk]++

const recentScreenings = screenings.slice(0, 5)

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon: Icon,
  iconClassName,
  href,
}: {
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  href?: string
}) {
  const content = (
    <Card className="gap-3 transition-colors hover:bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardDescription>{label}</CardDescription>
        <Icon className={cn("size-4 text-muted-foreground", iconClassName)} />
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-semibold text-foreground">{value}</span>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">A quick look at projects, screenings, and risk.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Projects" value={projects.length} icon={IconFolderOpen} href="/projects" />
        <StatTile label="Screenings" value={screenings.length} icon={IconClipboardList} href="/screenings" />
        <StatTile label="Dealbreakers" value={totalDealbreakers} icon={IconAlertTriangle} iconClassName="text-destructive" />
        <StatTile label="Gaps" value={totalGaps} icon={IconSearch} iconClassName="text-indicator-gap" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Risk distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Risk levels</CardTitle>
            <CardDescription>Screenings by risk level</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
              {RISK_LEVELS.map(({ level, dot }) => {
                const pct = (riskCounts[level] / screenings.length) * 100
                if (pct === 0) return null
                return (
                  <div
                    key={level}
                    className={cn("h-full first:rounded-l-full last:rounded-r-full", dot)}
                    style={{ width: `${pct}%` }}
                  />
                )
              })}
            </div>
            <ul className="flex flex-col gap-2.5">
              {RISK_LEVELS.map(({ level, dot }) => (
                <li key={level} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full shrink-0", dot)} />
                    <span className="text-muted-foreground">{level}</span>
                  </span>
                  <span className="font-medium text-foreground tabular-nums">{riskCounts[level]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent screenings */}
        <Card className="py-0 gap-0 overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Recent screenings</span>
            <Link
              href="/screenings"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <IconArrowRight className="size-3.5" />
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Screened at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentScreenings.map((screening) => (
                <TableRow
                  key={screening.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/screenings/${screening.id}`)}
                >
                  <TableCell className="font-medium text-foreground">{screening.project}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1.5 rounded-md">
                      <span className={cn("size-1.5 rounded-[3px] shrink-0", statusDot[screening.status])} />
                      {screening.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1.5 rounded-md">
                      <span className={cn("size-1.5 rounded-[3px] shrink-0", riskDot[screening.risk])} />
                      {screening.risk}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{screening.screenedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </div>

      {/* Recent projects */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">Projects</span>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <IconArrowRight className="size-3.5" />
          </Link>
        </div>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href="/projects"
                className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium text-foreground">{project.name}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {project.documents} doc{project.documents !== 1 && "s"}
                  </span>
                  <span className="text-xs text-muted-foreground w-36 text-right">{project.lastScreenedAt}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

    </div>
  )
}
