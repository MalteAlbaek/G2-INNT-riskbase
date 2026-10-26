import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/blocks/app-sidebar"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The proxy already redirects signed-out users; this is the authoritative check.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) redirect("/login")

  const email = claims.email ?? ""
  const name = (claims.user_metadata?.full_name as string | undefined) ?? email.split("@")[0]

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar user={{ name, email }} />
      <SidebarInset className="overflow-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
