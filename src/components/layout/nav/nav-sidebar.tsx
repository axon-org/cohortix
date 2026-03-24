import type React from 'react'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { APP_VERSION } from '@/lib/version'
import type { NavGroup } from './types'
import { NavGroup as NavGroupSection } from './nav-group'

export function NavSidebar({
  sidebarExpanded,
  filteredGroups,
  collapsedGroups,
  expandedParents,
  activeTab,
  toggleSidebar,
  toggleGroup,
  toggleParent,
  navigateToPanel,
  prefetchPanel,
  contextSwitcher,
}: {
  sidebarExpanded: boolean
  filteredGroups: NavGroup[]
  collapsedGroups: string[]
  expandedParents: Set<string>
  activeTab: string
  toggleSidebar: () => void
  toggleGroup: (groupId: string) => void
  toggleParent: (id: string) => void
  navigateToPanel: (tab: string) => void
  prefetchPanel: (tab: string) => void
  contextSwitcher: React.ReactNode
}) {
  // FR11: Hover-expand (peek) — temporarily expand when collapsed and hovered
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressHover = useRef(false)
  const isExpanded = sidebarExpanded || hoverExpanded

  function handleMouseEnter() {
    if (sidebarExpanded || suppressHover.current) return
    hoverTimeout.current = setTimeout(() => setHoverExpanded(true), 300)
  }

  function handleMouseLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setHoverExpanded(false)
    suppressHover.current = false
  }

  // Wrap toggleSidebar to suppress hover-expand right after manual collapse
  function handleToggleSidebar() {
    if (sidebarExpanded) {
      // Collapsing — suppress hover so it doesn't immediately re-expand
      suppressHover.current = true
      setHoverExpanded(false)
    }
    toggleSidebar()
  }

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`hidden shrink-0 flex-col border-r border-border bg-gradient-to-b from-card to-background transition-all duration-200 ease-in-out md:flex ${isExpanded ? 'w-60' : 'w-16'} ${hoverExpanded ? 'absolute inset-y-0 left-0 z-40 shadow-xl' : ''}`}
    >
      <div className={`shrink-0 ${isExpanded ? 'flex items-center gap-3 px-4 py-4' : 'flex flex-col items-center gap-2 py-4'}`}>
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background">
          <Image src="/brand/mc-logo-128.png" alt="Cohortix logo" width={40} height={40} className="size-full object-cover" />
        </div>
        {isExpanded && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-foreground">Cohortix</div>
            <div className="text-xs text-muted-foreground">v{APP_VERSION}</div>
          </div>
        )}
        <Button variant="ghost" size="icon-sm" onClick={handleToggleSidebar} className="shrink-0 rounded-xl" title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'} aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            {sidebarExpanded ? <polyline points="10,3 5,8 10,13" /> : <polyline points="6,3 11,8 6,13" />}
          </svg>
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden py-2">
        {filteredGroups.map((group, index) => (
          <div key={group.id}>
            {index > 0 && <div className={`border-t border-border/70 ${isExpanded ? 'mx-4 my-2' : 'mx-2 my-2'}`} />}
            <NavGroupSection
              group={group}
              sidebarExpanded={isExpanded}
              collapsed={collapsedGroups.includes(group.id)}
              activeTab={activeTab}
              expandedParents={expandedParents}
              onToggleGroup={toggleGroup}
              onToggleParent={toggleParent}
              navigateToPanel={navigateToPanel}
              prefetchPanel={prefetchPanel}
            />
          </div>
        ))}
      </div>

      {contextSwitcher}
    </nav>
  )
}
