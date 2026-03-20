"use client";

import { ArrowLeft, Menu, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentHeaderProps {
  onMenuClick: () => void;
}

export default function AgentHeader({ onMenuClick }: AgentHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Back + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <a
          href="#"
          className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </a>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 font-medium"
          >
            Agent Squad
          </a>
          <span className="text-muted-foreground shrink-0">/</span>
          <span className="text-foreground font-semibold truncate">Lubna</span>
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--brand-primary)" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 cursor-pointer"
          style={{ background: "var(--brand-primary)" }}
        >
          AK
        </div>
      </div>
    </header>
  );
}
