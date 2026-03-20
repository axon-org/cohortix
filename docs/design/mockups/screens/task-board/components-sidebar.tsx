"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Kanban,
  BarChart2,
  Users,
  FileText,
  Settings,
  Bell,
  ChevronDown,
  Zap,
  Inbox,
  CalendarDays,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#" },
  { icon: Kanban, label: "Task Board", href: "#", active: true },
  { icon: BarChart2, label: "Analytics", href: "#" },
  { icon: Inbox, label: "Inbox", href: "#", badge: 4 },
  { icon: CalendarDays, label: "Calendar", href: "#" },
  { icon: MessageSquare, label: "Messages", href: "#", badge: 2 },
  { icon: Users, label: "Team", href: "#" },
  { icon: FileText, label: "Documents", href: "#" },
]

const bottomItems = [
  { icon: Settings, label: "Settings", href: "#" },
  { icon: Bell, label: "Notifications", href: "#", badge: 7 },
]

const projects = [
  { name: "Axon Platform v2", color: "bg-indigo-500" },
  { name: "Meridian Core", color: "bg-emerald-500" },
  { name: "Halo Design System", color: "bg-amber-500" },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen flex-shrink-0 transition-all duration-300",
        "border-r border-[var(--sidebar-border)]",
        collapsed ? "w-[64px]" : "w-[220px]"
      )}
      style={{ background: "var(--brand-sidebar)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--sidebar-border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-[15px] tracking-tight">
            Cohortix
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-[var(--sidebar-fg)] opacity-40 hover:opacity-80 transition-opacity"
          aria-label="Toggle sidebar"
        >
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              collapsed ? "-rotate-90" : "rotate-90"
            )}
          />
        </button>
      </div>

      {/* Projects dropdown (collapsed: hide) */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-[var(--sidebar-border)]">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "hsl(248,15%,55%)" }}>
            Project
          </p>
          <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--sidebar-accent)] transition-colors group">
            <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
            <span className="text-[13px] font-medium truncate" style={{ color: "var(--sidebar-foreground)" }}>
              Axon Platform v2
            </span>
            <ChevronDown size={12} className="ml-auto opacity-50 group-hover:opacity-80" style={{ color: "var(--sidebar-foreground)" }} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-widest font-semibold px-2 mb-2" style={{ color: "hsl(248,15%,55%)" }}>
            Workspace
          </p>
        )}
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-[13px] font-medium transition-all duration-150 group",
              item.active
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] opacity-70 hover:opacity-100"
            )}
          >
            <item.icon size={16} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none",
                      item.active
                        ? "bg-white/20 text-white"
                        : "bg-[var(--brand-primary)] text-white"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-[var(--sidebar-border)] space-y-0.5">
        {bottomItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-[13px] font-medium transition-all duration-150 hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] opacity-60 hover:opacity-100"
          >
            <item.icon size={16} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </a>
        ))}
        {/* Avatar */}
        <div className={cn("flex items-center gap-2.5 px-2 py-2 mt-1", collapsed && "justify-center")}>
          <div className="w-7 h-7 rounded-full bg-indigo-400 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            MR
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[12px] font-semibold truncate text-white">Maya Reyes</p>
              <p className="text-[10px] truncate" style={{ color: "hsl(248,15%,55%)" }}>Product Lead</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
