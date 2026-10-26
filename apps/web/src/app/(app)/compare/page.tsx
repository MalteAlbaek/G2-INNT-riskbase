import type { Metadata } from "next"
import { ComparisonGrid } from "@/features/compare"
import { loadCompareData } from "@/features/compare/queries"

export const metadata: Metadata = {
  title: "Compare · Riskbase",
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { template } = await searchParams
  const compare = await loadCompareData(template)

  if (!compare) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-muted-foreground">
        No screenings to compare yet. Run a screening on a project to get started.
      </div>
    )
  }

  return <ComparisonGrid key={compare.data.id} {...compare} />
}
