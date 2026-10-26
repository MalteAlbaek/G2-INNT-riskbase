import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@riskbase/db-types"

/**
 * The organisation new records belong to: the user's last used one when they are a
 * member of several, otherwise their only membership. Null when they have none.
 */
export async function resolveOrgId(supabase: SupabaseClient<Database>): Promise<string | null> {
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims.sub
  if (!userId) return null

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("last_org_id").eq("id", userId).maybeSingle(),
    supabase.from("org_user").select("org_id").eq("user_id", userId),
  ])
  const orgIds = (memberships ?? []).map((m) => m.org_id)
  return orgIds.find((id) => id === profile?.last_org_id) ?? orgIds[0] ?? null
}
