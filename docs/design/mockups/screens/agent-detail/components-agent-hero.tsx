"use client";

import { Cpu, CheckCircle2, Zap } from "lucide-react";

const stats = [
  { label: "Total", value: "12", icon: Cpu },
  { label: "Done", value: "8", icon: CheckCircle2 },
  { label: "Active", value: "3", icon: Zap },
];

export default function AgentHero() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: "var(--brand-primary)" }} />

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar */}
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm"
          style={{ background: "var(--brand-primary)" }}
          aria-label="Lubna avatar"
        >
          LB
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Lubna
            </h1>
            {/* Idle badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Idle
            </span>
          </div>

          <p className="text-sm text-muted-foreground font-medium">
            UI Designer Specialist
          </p>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-sm"
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--brand-primary)" }}
                />
                <span className="font-semibold text-foreground">{value}</span>
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right meta on larger screens */}
        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
            Agent ID
          </span>
          <span className="font-mono text-xs text-foreground bg-muted rounded px-2 py-1 border border-border">
            AGT-0042
          </span>
          <span className="text-[11px] text-muted-foreground mt-1">
            Last active 2 min ago
          </span>
        </div>
      </div>
    </div>
  );
}
