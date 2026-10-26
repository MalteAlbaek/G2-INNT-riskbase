"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  IconShieldCheck,
  IconLayoutDashboard,
  IconFolderOpen,
  IconTemplate,
  IconClipboardList,
  IconLayoutColumns,
  IconLogout,
  IconSettings,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconCheck,
  IconChevronUp,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/login/actions"

const navItems = [
  { label: "Overview",   href: "/overview",   icon: IconLayoutDashboard },
  { label: "Projects",   href: "/projects",   icon: IconFolderOpen },
  { label: "Templates",  href: "/templates",  icon: IconTemplate },
  { label: "Screenings", href: "/screenings", icon: IconClipboardList },
  { label: "Compare",    href: "/compare",    icon: IconLayoutColumns },
]

function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export function AppSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <Sidebar collapsible="icon">

      <SidebarHeader className="flex flex-row items-center gap-2 px-3 py-4 group-data-[collapsible=icon]:px-0">
        <Link
          href="/projects"
          className="flex items-center gap-2 flex-1 min-w-0 group-data-[collapsible=icon]:hidden"
        >
          <IconShieldCheck className="size-5 text-primary shrink-0" />
          <span className="text-base font-semibold text-foreground">Riskbase</span>
        </Link>
        <SidebarTrigger className="group-data-[collapsible=icon]:mx-auto" />
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/")
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={href} />}
                      tooltip={label}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-sidebar-accent transition-colors outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" />
            }
          >
            <Avatar className="size-8 shrink-0">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            </div>
            <IconChevronUp className="size-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <IconSun />
                Light
                {theme === "light" && <IconCheck className="ml-auto size-3.5 text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <IconMoon />
                Dark
                {theme === "dark" && <IconCheck className="ml-auto size-3.5 text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <IconDeviceDesktop />
                System
                {theme === "system" && <IconCheck className="ml-auto size-3.5 text-muted-foreground" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconSettings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logout()}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

    </Sidebar>
  )
}
