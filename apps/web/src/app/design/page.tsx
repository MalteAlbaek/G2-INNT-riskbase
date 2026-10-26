import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconClipboardList,
  IconCopy,
  IconDots,
  IconExternalLink,
  IconEye,
  IconFolderOpen,
  IconInfoCircle,
  IconLayoutDashboard,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconTable,
  IconTemplate,
  IconTrash,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CountCell } from "@/components/ui/count-cell"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { StatusBadge } from "@/components/ui/status-badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-medium text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function ColorSwatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border p-2.5">
      <div
        className="size-9 shrink-0 rounded-md ring-1 ring-foreground/10"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {varName}
        </span>
      </div>
    </div>
  )
}

function RadiusSwatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex size-16 items-center justify-center border-2 border-primary bg-primary/10"
        style={{ borderRadius: `var(${varName})` }}
      />
      <div className="flex flex-col items-center">
        <span className="text-xs font-medium text-foreground">{name}</span>
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          {varName}
        </span>
      </div>
    </div>
  )
}

const baseColors = [
  { name: "Background", varName: "--background" },
  { name: "Foreground", varName: "--foreground" },
]

const surfaceColors = [
  { name: "Card", varName: "--card" },
  { name: "Card Foreground", varName: "--card-foreground" },
  { name: "Popover", varName: "--popover" },
  { name: "Popover Foreground", varName: "--popover-foreground" },
]

const brandColors = [
  { name: "Primary", varName: "--primary" },
  { name: "Primary Foreground", varName: "--primary-foreground" },
  { name: "Secondary", varName: "--secondary" },
  { name: "Secondary Foreground", varName: "--secondary-foreground" },
  { name: "Muted", varName: "--muted" },
  { name: "Muted Foreground", varName: "--muted-foreground" },
  { name: "Accent", varName: "--accent" },
  { name: "Accent Foreground", varName: "--accent-foreground" },
]

const statusColors = [
  { name: "Destructive", varName: "--destructive" },
  { name: "Indicator DB", varName: "--indicator-db" },
  { name: "Indicator Gap", varName: "--indicator-gap" },
]

const chartColors = [
  { name: "Chart 1", varName: "--chart-1" },
  { name: "Chart 2", varName: "--chart-2" },
  { name: "Chart 3", varName: "--chart-3" },
  { name: "Chart 4", varName: "--chart-4" },
  { name: "Chart 5", varName: "--chart-5" },
]

const borderColors = [
  { name: "Border", varName: "--border" },
  { name: "Input", varName: "--input" },
  { name: "Ring", varName: "--ring" },
]

const sidebarColors = [
  { name: "Sidebar", varName: "--sidebar" },
  { name: "Sidebar Foreground", varName: "--sidebar-foreground" },
  { name: "Sidebar Primary", varName: "--sidebar-primary" },
  { name: "Sidebar Primary Foreground", varName: "--sidebar-primary-foreground" },
  { name: "Sidebar Accent", varName: "--sidebar-accent" },
  { name: "Sidebar Accent Foreground", varName: "--sidebar-accent-foreground" },
  { name: "Sidebar Border", varName: "--sidebar-border" },
  { name: "Sidebar Ring", varName: "--sidebar-ring" },
]

const radii = [
  { name: "sm", varName: "--radius-sm" },
  { name: "md", varName: "--radius-md" },
  { name: "lg", varName: "--radius-lg" },
  { name: "xl", varName: "--radius-xl" },
  { name: "2xl", varName: "--radius-2xl" },
  { name: "3xl", varName: "--radius-3xl" },
  { name: "4xl", varName: "--radius-4xl" },
]

const buttonVariants = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

const buttonSizes = ["xs", "sm", "default", "lg"] as const

const badgeVariants = [
  "default",
  "secondary",
  "destructive",
  "warning",
  "outline",
  "ghost",
  "link",
] as const

const icons = [
  { icon: IconShieldCheck, name: "IconShieldCheck" },
  { icon: IconAlertTriangle, name: "IconAlertTriangle" },
  { icon: IconTemplate, name: "IconTemplate" },
  { icon: IconClipboardList, name: "IconClipboardList" },
  { icon: IconTable, name: "IconTable" },
  { icon: IconLayoutDashboard, name: "IconLayoutDashboard" },
  { icon: IconFolderOpen, name: "IconFolderOpen" },
  { icon: IconSettings, name: "IconSettings" },
  { icon: IconSearch, name: "IconSearch" },
  { icon: IconPlus, name: "IconPlus" },
  { icon: IconPencil, name: "IconPencil" },
  { icon: IconTrash, name: "IconTrash" },
  { icon: IconCopy, name: "IconCopy" },
  { icon: IconRefresh, name: "IconRefresh" },
  { icon: IconEye, name: "IconEye" },
  { icon: IconDots, name: "IconDots" },
  { icon: IconInfoCircle, name: "IconInfoCircle" },
  { icon: IconExternalLink, name: "IconExternalLink" },
  { icon: IconCheck, name: "IconCheck" },
  { icon: IconChevronRight, name: "IconChevronRight" },
  { icon: IconArrowRight, name: "IconArrowRight" },
]

export default function DesignPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Design system
          </h1>
          <p className="text-sm text-muted-foreground">
            Tokens and components in use across riskbase. Pulled straight from
            globals.css and components/ui, not a separate spec.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section
        title="Colors"
        description="Semantic tokens defined in globals.css. Values flip automatically between light and dark."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Base
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {baseColors.map((c) => (
                <ColorSwatch key={c.varName} {...c} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Surfaces
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {surfaceColors.map((c) => (
                <ColorSwatch key={c.varName} {...c} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Brand &amp; actions
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {brandColors.map((c) => (
                <ColorSwatch key={c.varName} {...c} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Status &amp; charts
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {statusColors.map((c) => (
                <ColorSwatch key={c.varName} {...c} />
              ))}
              {chartColors.map((c) => (
                <ColorSwatch key={c.varName} {...c} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Borders &amp; rings
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {borderColors.map((c) => (
                <ColorSwatch key={c.varName} {...c} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Sidebar
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sidebarColors.map((c) => (
                <ColorSwatch key={c.varName} {...c} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Separator />

      <Section
        title="Typography"
        description="Inter for UI text and headings, Geist Mono for code/mono."
      >
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h1 className="font-heading text-4xl font-semibold text-foreground">
            Heading 1 — font-heading
          </h1>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Heading 2 — font-heading
          </h2>
          <h3 className="font-heading text-lg font-medium text-foreground">
            Heading 3 — font-heading
          </h3>
          <p className="text-sm text-foreground">
            Body text — font-sans, text-sm. The quick brown fox jumps over
            the lazy dog.
          </p>
          <p className="text-sm text-muted-foreground">
            Muted body text — text-muted-foreground.
          </p>
          <p className="font-mono text-sm text-foreground">
            Monospace — font-mono, used for code and var names.
          </p>
        </div>
      </Section>

      <Separator />

      <Section
        title="Radius scale"
        description="All derived from a single --radius value."
      >
        <div className="flex flex-wrap gap-6 rounded-lg border border-border p-4">
          {radii.map((r) => (
            <RadiusSwatch key={r.varName} {...r} />
          ))}
        </div>
      </Section>

      <Separator />

      <Section title="Buttons" description="components/ui/button.tsx">
        <div className="flex flex-col gap-4">
          {buttonVariants.map((variant) => (
            <div key={variant} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                {variant}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {buttonSizes.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    Button
                  </Button>
                ))}
                <Button variant={variant} size="icon">
                  <IconPlus />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      <Section
        title="Badges"
        description="components/ui/badge.tsx, plus the status-badge and count-cell wrappers built on top of it."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {badgeVariants.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="Active" />
            <StatusBadge status="Review" />
            <StatusBadge status="Closed" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CountCell count={12} dot="bg-primary" />
            <CountCell count={3} dot="bg-destructive" />
            <CountCell count={0} dot="bg-muted-foreground" />
          </div>
        </div>
      </Section>

      <Separator />

      <Section title="Form controls">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Input
            </span>
            <Input placeholder="Search projects..." />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Select
            </span>
            <Select defaultValue="active">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Switch
            </span>
            <div className="flex items-center gap-3">
              <Switch defaultChecked />
              <Switch size="sm" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Slider
            </span>
            <Slider defaultValue={[40]} className="mt-2" />
          </div>
        </div>
      </Section>

      <Separator />

      <Section title="Avatars, skeletons, tooltips">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>SK</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>RB</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="size-8 rounded-full" />
          </div>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="sm" />}>
              Hover me
            </TooltipTrigger>
            <TooltipContent>This is a tooltip</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      <Separator />

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <IconShieldCheck className="mb-1 size-6 text-primary" />
              <CardTitle className="text-base">Card title</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Standard card, used for feature blocks and summaries.
              </CardDescription>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Compact card</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>size=&quot;sm&quot; variant.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">With badge</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <StatusBadge status="Active" />
              <CardDescription>Composed with other primitives.</CardDescription>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Separator />

      <Section title="Table" description="components/ui/table.tsx">
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Findings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Acme Holdings</TableCell>
                <TableCell>
                  <StatusBadge status="Active" />
                </TableCell>
                <TableCell>
                  <CountCell count={4} dot="bg-primary" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nordic Capital</TableCell>
                <TableCell>
                  <StatusBadge status="Review" />
                </TableCell>
                <TableCell>
                  <CountCell count={1} dot="bg-destructive" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Baltic Ventures</TableCell>
                <TableCell>
                  <StatusBadge status="Closed" />
                </TableCell>
                <TableCell>
                  <CountCell count={0} dot="bg-muted-foreground" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      <Separator />

      <Section
        title="Icons"
        description="@tabler/icons-react, the icon set used across the app."
      >
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {icons.map(({ icon: Icon, name }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3"
            >
              <Icon className="size-5 text-foreground" />
              <span className="truncate text-center font-mono text-[0.6rem] text-muted-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
