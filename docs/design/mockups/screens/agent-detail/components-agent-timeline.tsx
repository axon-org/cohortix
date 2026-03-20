"use client";

import { cn } from "@/lib/utils";
import {
  Pencil,
  MessageSquare,
  CheckCheck,
  RefreshCw,
  Database,
} from "lucide-react";

const timelineItems = [
  {
    time: "09:14 AM",
    icon: Pencil,
    label: "Drafted",
    action: "Completed wireframe iteration for the onboarding flow",
    color: "indigo",
  },
  {
    time: "10:02 AM",
    icon: MessageSquare,
    label: "Comment",
    action: "Left feedback on the navigation redesign PR #204",
    color: "sky",
  },
  {
    time: "11:30 AM",
    icon: CheckCheck,
    label: "Task done",
    action: "Marked \"Accessibility audit – dashboard\" as complete",
    color: "green",
  },
  {
    time: "01:45 PM",
    icon: RefreshCw,
    label: "Retry",
    action: "Re-ran design token generation after schema update",
    color: "amber",
  },
  {
    time: "03:07 PM",
    icon: Database,
    label: "Memory write",
    action: "Stored user preference patterns into long-term memory",
    color: "purple",
  },
];

const colorMap: Record<
  string,
  { dot: string; icon: string; bg: string; border: string }
> = {
  indigo: {
    dot: "bg-indigo-500",
    icon: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  sky: {
    dot: "bg-sky-500",
    icon: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
  },
  green: {
    dot: "bg-green-500",
    icon: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  amber: {
    dot: "bg-amber-500",
    icon: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  purple: {
    dot: "bg-purple-500",
    icon: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
};

interface AgentTimelineProps {
  embedded?: boolean;
}

export default function AgentTimeline({ embedded = false }: AgentTimelineProps) {
  return (
    <div
      className={cn(!embedded && "rounded-2xl border border-border bg-card shadow-sm p-5")}
    >
      {!embedded && (
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Activity History
        </h2>
      )}

      <ol className="relative space-y-0">
        {timelineItems.map((item, idx) => {
          const c = colorMap[item.color];
          const Icon = item.icon;
          const isLast = idx === timelineItems.length - 1;

          return (
            <li key={idx} className="flex gap-3 group">
              {/* Timeline spine */}
              <div className="flex flex-col items-center">
                {/* Dot */}
                <div
                  className={cn(
                    "mt-[18px] h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-card",
                    c.dot
                  )}
                />
                {/* Line */}
                {!isLast && (
                  <div className="mt-1 flex-1 w-px bg-border" />
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 rounded-xl border px-3 py-3 mb-3 transition-shadow hover:shadow-sm",
                  c.bg,
                  c.border
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md flex items-center justify-center shrink-0",
                      c.bg
                    )}
                  >
                    <Icon className={cn("h-3 w-3", c.icon)} />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider",
                      c.icon
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="ml-auto text-[11px] text-muted-foreground font-mono">
                    {item.time}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed pl-7">
                  {item.action}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
