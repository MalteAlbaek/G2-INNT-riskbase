import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const dotColors: Record<string, string> = {
  Active:  "bg-primary",
  Review:  "bg-warning",
  Closed:  "bg-muted-foreground",
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className={cn("size-1.5 rounded-[3px] shrink-0", dotColors[status] ?? "bg-muted-foreground")}
      />
      {status}
    </Badge>
  )
}
