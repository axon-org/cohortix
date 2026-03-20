"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Kanban,
  Bot,
  Activity,
  ScrollText,
  BrainCircuit,
  Coins,
  Bell,
  Search,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Clock,
  ChevronRight,
  TrendingUp,
  Zap,
  CheckCircle2,
  Circle,
  AlertCircle,
  MoreHorizontal,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "tasks", label: "Task Board", icon: Kanban },
  { id: "agents", label: "Agent Squad", icon: Bot },
  { id: "activity", label: "Activity Feed", icon: Activity },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "memory", label: "Memory", icon: BrainCircuit },
  { id: "tokens", label: "Tokens", icon: Coins },
];

const STAT_CARDS = [
  {
    label: "Active Sessions",
    value: "12",
    delta: "+3 since 9 am",
    positive: true,
    icon: Zap,
    accent: "indigo",
  },
  {
    label: "Tasks In Progress",
    value: "28",
    delta: "6 due today",
    positive: null,
    icon: CheckCircle2,
    accent: "amber",
  },
  {
    label: "Agents Online",
    value: "5 of 8",
    delta: "3 idle",
    positive: false,
    icon: Bot,
    accent: "green",
  },
  {
    label: "Messages Today",
    value: "143",
    delta: "+22% vs yesterday",
    positive: true,
    icon: MessageSquare,
    accent: "blue",
  },
];

const ACTIVITY_EVENTS = [
  {
    id: 1,
    initials: "SR",
    color: "bg-violet-500",
    text: "Sophia ran task **Deploy staging pipeline** via Agent Nexus.",
    time: "2 min ago",
    icon: "run",
  },
  {
    id: 2,
    initials: "DK",
    color: "bg-sky-500",
    text: "Daniel updated **Memory snapshot** for Squad Alpha.",
    time: "14 min ago",
    icon: "update",
  },
  {
    id: 3,
    initials: "TW",
    color: "bg-emerald-500",
    text: "Tara completed **API rate-limit audit** · 3 findings.",
    time: "41 min ago",
    icon: "done",
  },
  {
    id: 4,
    initials: "AM",
    color: "bg-orange-500",
    text: "You pushed **12 commits** to branch `feat/dashboard-v2`.",
    time: "1 hr ago",
    icon: "commit",
  },
  {
    id: 5,
    initials: "JL",
    color: "bg-pink-500",
    text: "Jamie opened PR **#47 — Token Usage Charts** · awaiting review.",
    time: "2 hr ago",
    icon: "pr",
  },
];

const AGENTS = [
  {
    id: 1,
    name: "Nexus",
    role: "Orchestration",
    status: "online",
    tasks: 4,
    model: "GPT-4o",
  },
  {
    id: 2,
    name: "Iris",
    role: "Code Review",
    status: "online",
    tasks: 2,
    model: "Claude 3.5",
  },
  {
    id: 3,
    name: "Atlas",
    role: "Data Pipeline",
    status: "idle",
    tasks: 0,
    model: "Gemini 1.5",
  },
  {
    id: 4,
    name: "Sage",
    role: "Documentation",
    status: "offline",
    tasks: 0,
    model: "GPT-4o mini",
  },
];

const TOKEN_DATA = [
  { day: "Mon", input: 18400, output: 7200 },
  { day: "Tue", input: 22100, output: 9800 },
  { day: "Wed", input: 19500, output: 8100 },
  { day: "Thu", input: 31200, output: 13400 },
  { day: "Fri", input: 27800, output: 11200 },
  { day: "Sat", input: 14300, output: 6700 },
  { day: "Sun", input: 16900, output: 7400 },
];

const CRONS = [
  {
    id: 1,
    name: "Nightly DB Snapshot",
    schedule: "0 2 * * *",
    next: "Tonight 02:00",
    status: "active",
  },
  {
    id: 2,
    name: "Agent Health Check",
    schedule: "*/15 * * * *",
    next: "In 8 min",
    status: "active",
  },
  {
    id: 3,
    name: "Token Usage Report",
    schedule: "0 9 * * 1",
    next: "Mon 09:00",
    status: "paused",
  },
];

const GITHUB_STATS = [
  { label: "Open PRs", value: 7, icon: GitPullRequest, color: "text-violet-500" },
  { label: "Commits today", value: 23, icon: GitCommit, color: "text-sky-500" },
  { label: "Branches", value: 14, icon: GitBranch, color: "text-emerald-500" },
  { label: "Stars", value: 312, icon: Star, color: "text-amber-500" },
];

/* ─────────────────────────────────────────────
   STATUS HELPERS
───────────────────────────────────────────── */
function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    online: "bg-emerald-400",
    idle: "bg-amber-400",
    offline: "bg-zinc-400",
  };
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full ring-2 ring-white",
        map[status] ?? "bg-zinc-400"
      )}
    />
  );
}

function accentClasses(accent: string) {
  const map: Record<string, { bg: string; icon: string; border: string }> = {
    indigo: {
      bg: "bg-[hsl(248,60%,96%)]",
      icon: "text-[hsl(248,50%,52%)]",
      border: "border-[hsl(248,50%,88%)]",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      border: "border-amber-200",
    },
    green: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      border: "border-emerald-200",
    },
    blue: {
      bg: "bg-sky-50",
      icon: "text-sky-600",
      border: "border-sky-200",
    },
  };
  return map[accent] ?? map.indigo;
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function ActivityText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-[hsl(248,50%,52%)]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function CustomTokenTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-[hsl(248,50%,52%)]">Input: {payload[0]?.value?.toLocaleString()}</p>
      <p className="text-sky-500">Output: {payload[1]?.value?.toLocaleString()}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function CohortixDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [searchVal, setSearchVal] = useState("");

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-sans antialiased"
      style={{ background: "var(--brand-bg)" }}
    >
      {/* ── SIDEBAR ── */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 h-full border-r"
        style={{
          background: "var(--brand-sidebar)",
          borderColor: "var(--brand-sidebar-border)",
        }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2 px-5 py-5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--brand-primary)" }}
          >
            C
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: "var(--brand-sidebar-fg)" }}
          >
            Cohortix
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 mt-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  isActive
                    ? "text-white"
                    : "hover:bg-white/8"
                )}
                style={
                  isActive
                    ? { background: "var(--brand-primary)", color: "white" }
                    : { color: "var(--brand-sidebar-muted)" }
                }
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={16} className={cn(isActive ? "opacity-100" : "opacity-70")} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User avatar */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-t"
          style={{ borderColor: "var(--brand-sidebar-border)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "var(--brand-primary)" }}
          >
            AM
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--brand-sidebar-fg)" }}
            >
              Alex Morgan
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--brand-sidebar-muted)" }}
            >
              Admin
            </p>
          </div>
          <MoreHorizontal
            size={15}
            className="ml-auto shrink-0 opacity-40"
            style={{ color: "var(--brand-sidebar-fg)" }}
          />
        </div>
      </aside>

      {/* ── MAIN COLUMN ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* ── HEADER ── */}
        <header
          className="shrink-0 flex items-center gap-3 px-5 py-3 border-b bg-white"
          style={{ borderColor: "var(--brand-border)" }}
        >
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search tasks, agents, logs…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[hsl(248,50%,52%)]/30 placeholder:text-muted-foreground"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Bell */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell size={17} className="text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
              style={{ background: "var(--brand-primary)" }}
              aria-label="User menu"
            >
              AM
            </div>
          </div>
        </header>

        {/* ── SCROLL AREA ── */}
        <main
          className="flex-1 overflow-y-auto p-5 space-y-5"
          style={{ background: "var(--brand-bg)" }}
        >
          {/* Page title */}
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Thursday, March 20, 2026 · Good morning, Alex
            </p>
          </div>

          {/* ── STAT CARDS ── */}
          <section
            className="grid grid-cols-2 xl:grid-cols-4 gap-3"
            aria-label="Key metrics"
          >
            {STAT_CARDS.map((card) => {
              const Icon = card.icon;
              const ac = accentClasses(card.accent);
              return (
                <div
                  key={card.label}
                  className="bg-card rounded-xl border p-4 flex flex-col gap-3"
                  style={{ borderColor: "var(--brand-border)" }}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", ac.bg, ac.border)}>
                      <Icon size={15} className={ac.icon} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight leading-none">
                    {card.value}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      card.positive === true
                        ? "text-emerald-600"
                        : card.positive === false
                        ? "text-red-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {card.positive === true && <TrendingUp size={11} className="inline mr-1" />}
                    {card.delta}
                  </p>
                </div>
              );
            })}
          </section>

          {/* ── TWO COLUMN: Activity + Agents ── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Feed */}
            <div
              className="bg-card rounded-xl border"
              style={{ borderColor: "var(--brand-border)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--brand-border)" }}>
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-[hsl(248,50%,52%)]" />
                  <h2 className="text-sm font-semibold text-foreground">Activity Feed</h2>
                </div>
                <button className="text-xs text-[hsl(248,50%,52%)] font-medium hover:underline flex items-center gap-0.5">
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <ul className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
                {ACTIVITY_EVENTS.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5",
                        ev.color
                      )}
                      aria-hidden
                    >
                      {ev.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-muted-foreground leading-snug">
                        <ActivityText text={ev.text} />
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{ev.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agent Status */}
            <div
              className="bg-card rounded-xl border"
              style={{ borderColor: "var(--brand-border)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--brand-border)" }}>
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-[hsl(248,50%,52%)]" />
                  <h2 className="text-sm font-semibold text-foreground">Agent Squad</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-emerald-600">5</span> / 8 online
                </span>
              </div>
              <ul className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
                {AGENTS.map((agent) => (
                  <li
                    key={agent.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-[hsl(248,60%,96%)] flex items-center justify-center">
                        <Bot size={16} className="text-[hsl(248,50%,52%)]" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot status={agent.status} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{agent.model}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{agent.role}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-foreground">{agent.tasks}</p>
                      <p className="text-[10px] text-muted-foreground">tasks</p>
                    </div>
                    <span
                      className={cn(
                        "ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                        agent.status === "online"
                          ? "bg-emerald-50 text-emerald-700"
                          : agent.status === "idle"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      {agent.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── WIDGETS ROW ── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GitHub Stats */}
            <div
              className="bg-card rounded-xl border p-4"
              style={{ borderColor: "var(--brand-border)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <GitBranch size={15} className="text-[hsl(248,50%,52%)]" />
                <h2 className="text-sm font-semibold text-foreground">GitHub Stats</h2>
                <span className="ml-auto text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground">cohortix/core</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GITHUB_STATS.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/60"
                    >
                      <Icon size={16} className={stat.color} />
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: "var(--brand-border)" }}>
                <Users size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">4 contributors this week</span>
              </div>
            </div>

            {/* Token Usage Chart */}
            <div
              className="bg-card rounded-xl border p-4"
              style={{ borderColor: "var(--brand-border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Coins size={15} className="text-[hsl(248,50%,52%)]" />
                <h2 className="text-sm font-semibold text-foreground">Token Usage</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Last 7 days · input + output</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "hsl(248,50%,52%)" }} />
                  Input
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-sky-400" />
                  Output
                </span>
                <span className="ml-auto text-xs font-bold text-foreground">150.6K</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={TOKEN_DATA} barSize={6} barGap={2}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(220,10%,55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTokenTooltip />} cursor={{ fill: "hsl(40,20%,94%)" }} />
                  <Bar dataKey="input" fill="hsl(248,50%,52%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="output" fill="hsl(210,80%,65%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Upcoming Crons */}
            <div
              className="bg-card rounded-xl border p-4"
              style={{ borderColor: "var(--brand-border)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-[hsl(248,50%,52%)]" />
                <h2 className="text-sm font-semibold text-foreground">Upcoming Crons</h2>
              </div>
              <ul className="space-y-2.5">
                {CRONS.map((cron) => (
                  <li
                    key={cron.id}
                    className="flex items-start gap-2.5"
                  >
                    <div className="mt-0.5 shrink-0">
                      {cron.status === "active" ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={14} className="text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{cron.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{cron.schedule}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                          cron.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {cron.status}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cron.next}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                className="mt-4 w-full text-xs text-[hsl(248,50%,52%)] font-medium border border-[hsl(248,50%,85%)] rounded-lg py-1.5 hover:bg-[hsl(248,60%,96%)] transition-colors"
              >
                Manage all cron jobs →
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
