"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import AgentHeader from "@/components/agent-header";
import AgentHero from "@/components/agent-hero";
import AgentTabs from "@/components/agent-tabs";
import RightPanel from "@/components/right-panel";

export default function AgentDetailScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-sans"
      style={{ background: "var(--brand-bg)" }}
    >
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AgentHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center column */}
          <main className="flex-1 overflow-y-auto px-4 pb-8 md:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-5 pt-5">
              <AgentHero />
              <AgentTabs />
            </div>
          </main>

          {/* Right panel — hidden below lg */}
          <aside className="hidden lg:flex w-[280px] shrink-0 flex-col overflow-y-auto border-l border-border px-4 pb-8 pt-5">
            <RightPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
