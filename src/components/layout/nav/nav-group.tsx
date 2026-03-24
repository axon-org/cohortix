import { Button } from '@/components/ui/button'
import type { NavGroup as NavGroupType } from './types'
import { NavItemButton } from './nav-item'

export function NavGroup({
  group,
  sidebarExpanded,
  collapsed,
  activeTab,
  expandedParents,
  onToggleGroup,
  onToggleParent,
  navigateToPanel,
  prefetchPanel,
}: {
  group: NavGroupType
  sidebarExpanded: boolean
  collapsed: boolean
  activeTab: string
  expandedParents: Set<string>
  onToggleGroup: (groupId: string) => void
  onToggleParent: (id: string) => void
  navigateToPanel: (tab: string) => void
  prefetchPanel: (tab: string) => void
}) {
  return (
    <div>
      {sidebarExpanded && group.label && (
        <Button
          variant="ghost"
          onClick={() => onToggleGroup(group.id)}
          className="group/header h-11 w-full justify-between rounded-none px-4 text-left hover:bg-transparent"
        >
          <span className="text-xs font-semibold tracking-widest text-muted-foreground">{group.label}</span>
          <Chevron className={`size-3 text-muted-foreground/70 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </Button>
      )}

      <div className={`overflow-hidden transition-all duration-200 ${sidebarExpanded && collapsed ? 'max-h-0 opacity-0' : 'max-h-[40rem] opacity-100'}`}>
        <div className={`flex flex-col ${sidebarExpanded ? 'gap-1 px-3 py-1' : 'items-center gap-1 py-2'}`}>
          {group.items.map((item) => {
            if (item.children) {
              const isParentExpanded = expandedParents.has(item.id)
              const childActive = item.children.some((c) => activeTab === c.id)
              if (!sidebarExpanded) {
                return (
                  <NavItemButton
                    key={item.id}
                    item={item}
                    active={childActive}
                    expanded={false}
                    onClick={() => navigateToPanel(item.children![0].id)}
                    onPrefetch={() => item.children?.forEach((child) => prefetchPanel(child.id))}
                  />
                )
              }

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigateToPanel(item.id)
                        if (!isParentExpanded) onToggleParent(item.id)
                      }}
                      onMouseEnter={() => {
                        prefetchPanel(item.id)
                        item.children?.forEach((child) => prefetchPanel(child.id))
                      }}
                      onFocus={() => item.children?.forEach((child) => prefetchPanel(child.id))}
                      className={`relative h-11 flex-1 justify-start gap-3 rounded-l-xl rounded-r-none px-3 text-left text-sm ${
                        activeTab === item.id
                          ? 'bg-primary/15 text-primary hover:bg-primary/20'
                          : childActive && !isParentExpanded
                            ? 'bg-primary/10 text-primary/90 hover:bg-primary/15'
                            : 'text-foreground hover:bg-secondary/70'
                      }`}
                    >
                      {activeTab === item.id && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
                      <span className="size-5 shrink-0">{item.icon}</span>
                      <span className="truncate font-medium">{item.label}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleParent(item.id)
                      }}
                      className="h-11 rounded-l-none rounded-r-xl px-2"
                      title={isParentExpanded ? 'Collapse' : 'Expand'}
                    >
                      <Chevron className={`size-3 text-muted-foreground transition-transform ${isParentExpanded ? '' : '-rotate-90'}`} />
                    </Button>
                  </div>
                  <div className={`overflow-hidden pl-4 transition-all duration-200 ${isParentExpanded ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-1 py-1">
                      {item.children.map((child) => (
                        <NavItemButton
                          key={child.id}
                          item={child}
                          active={activeTab === child.id}
                          expanded
                          nested
                          onClick={() => navigateToPanel(child.id)}
                          onPrefetch={() => prefetchPanel(child.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <NavItemButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                expanded={sidebarExpanded}
                onClick={() => navigateToPanel(item.id)}
                onPrefetch={() => prefetchPanel(item.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="4,6 8,10 12,6" />
    </svg>
  )
}
