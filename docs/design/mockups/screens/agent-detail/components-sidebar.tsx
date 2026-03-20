"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users2,
  BotMessageSquare,
  BarChart3,
  Settings,
  Bell,
  HelpCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "WORKSPACE",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "#" },
      {
        icon: Users2,
        label: "Agent Squad",
        href: "#",
        active: true,
        badge: "4",
      },
      { icon: BotMessageSquare, label: "Sessions", href: "#" },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { icon: BarChart3, label: "Reports", href: "#" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { icon: Bell, label: "Notifications", href: "#", badge: "2" },
      { icon: Settings, label: "Settings", href: "#" },
      { icon: HelpCircle, label: "Help & Docs", href: "#" },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-card border-r border-border transition-transform duration-200 lg:relative lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--brand-primary)" }}
          >
            <BotMessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">
            Cohortix
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      item.active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    style={
                      item.active
                        ? { background: "var(--brand-primary)" }
                        : undefined
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                          item.active
                            ? "bg-white/20 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer avatar */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold"
            style={{ background: "var(--brand-primary)" }}
          >
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              Aiden K.
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Admin
            </p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
      </div>
    </aside>
  );
}
