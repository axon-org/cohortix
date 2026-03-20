"use client";

import { useState } from "react";
import {
  Zap,
  MonitorPlay,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    id: "ping",
    label: "Ping Agent",
    icon: Zap,
    description: "Send a direct signal",
  },
  {
    id: "session",
    label: "View Session",
    icon: MonitorPlay,
    description: "Open live session feed",
  },
  {
    id: "assign",
    label: "Assign Task",
    icon: ClipboardList,
    description: "Queue a new task",
  },
];

const recentTasks = [
  { label: "Dashboard accessibility audit", done: true },
  { label: "Onboarding wireframes v3", done: true },
  { label: "Design token refresh", done: false },
];

export default function RightPanel() {
  const [pinged, setPinged] = useState(false);

  function handleAction(id: string) {
    if (id === "ping") {
      setPinged(true);
      setTimeout(() => setPinged(false), 2000);
    }
  }

  return (
    <div className="space-y-5">
      {/* Current Task card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="h-0.5 w-full" style={{ background: "var(--brand-primary)" }} />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Current Task
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
              <Clock className="h-2.5 w-2.5" />
              In Progress
            </span>
          </div>

          <p className="text-sm font-medium text-foreground leading-snug">
            Redesign the component library tokens for dark mode
          </p>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span className="font-semibold text-foreground">67%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: "67%",
                  background: "var(--brand-primary)",
                }}
              />
            </div>
          </div>

          {/* Sub-tasks */}
          <ul className="space-y-1.5 pt-1">
            {recentTasks.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2
                  className={cn(
                    "h-3.5 w-3.5 mt-0.5 shrink-0",
                    t.done ? "text-green-500" : "text-muted-foreground/40"
                  )}
                />
                <span
                  className={cn(
                    "text-xs leading-relaxed",
                    t.done
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {t.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Due date */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border pt-2.5">
            <Clock className="h-3 w-3 shrink-0" />
            Due: <span className="font-medium text-foreground">Today, 5:00 PM</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {quickActions.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:shadow-sm group",
                id === "ping" && pinged
                  ? "border-green-300 bg-green-50"
                  : "bg-background hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  id === "ping" && pinged
                    ? "bg-green-100"
                    : "group-hover:opacity-90"
                )}
                style={
                  !(id === "ping" && pinged)
                    ? {
                        background:
                          "var(--brand-primary-light, hsl(248,60%,95%))",
                      }
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    id === "ping" && pinged
                      ? "text-green-600"
                      : ""
                  )}
                  style={
                    !(id === "ping" && pinged)
                      ? { color: "var(--brand-primary)" }
                      : undefined
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    id === "ping" && pinged
                      ? "text-green-700"
                      : "text-foreground"
                  )}
                >
                  {id === "ping" && pinged ? "Pinged!" : label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent metadata */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Agent Info
        </h3>
        {[
          { key: "Model", value: "GPT-4o" },
          { key: "Runtime", value: "v2.4.1" },
          { key: "Memory", value: "Persistent" },
          { key: "Region", value: "us-east-1" },
        ].map(({ key, value }) => (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
