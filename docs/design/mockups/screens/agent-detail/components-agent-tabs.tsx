"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import AgentTimeline from "@/components/agent-timeline";

const tabs = [
  { id: "history", label: "History" },
  { id: "costs", label: "Costs" },
  { id: "comms", label: "Comms" },
  { id: "memory", label: "Memory" },
  { id: "settings", label: "Settings" },
];

// Placeholder panels for non-active tabs
function EmptyTabPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <div
        className="mb-3 h-10 w-10 rounded-full flex items-center justify-center"
        style={{ background: "var(--brand-primary-light, hsl(248,60%,95%))" }}
      >
        <span className="text-lg" style={{ color: "var(--brand-primary)" }}>
          ·
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs mt-1 text-muted-foreground">
        Nothing to show yet.
      </p>
    </div>
  );
}

export default function AgentTabs() {
  const [active, setActive] = useState("history");

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="border-b border-border px-1">
        <div
          className="flex overflow-x-auto scrollbar-none"
          role="tablist"
          aria-label="Agent detail tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active === tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative shrink-0 px-4 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none",
                active === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {active === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panel */}
      <div role="tabpanel" className="px-5 py-4">
        {active === "history" ? (
          <AgentTimeline embedded />
        ) : (
          <EmptyTabPanel
            label={tabs.find((t) => t.id === active)?.label ?? ""}
          />
        )}
      </div>
    </div>
  );
}
