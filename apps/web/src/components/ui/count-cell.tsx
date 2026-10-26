import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CountCellProps {
  count: number
  dot: string
}

export function CountCell({ count, dot }: CountCellProps) {
  return (
    <Badge variant="secondary" className="gap-1.5 rounded-md">
      <span className={cn("size-1.5 rounded-[3px] shrink-0", dot)} />
      {count}
    </Badge>
  )
}
