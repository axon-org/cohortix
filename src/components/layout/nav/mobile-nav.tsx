import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { NavGroup, NavItem } from './types'

export function MobileNav({ activeTab, navigateToPanel, groups, items }: {
  activeTab: string
  navigateToPanel: (tab: string) => void
  groups: NavGroup[]
  items: NavItem[]
}) {
  const tn = useTranslations('nav')
  const [sheetOpen, setSheetOpen] = useState(false)
  const priorityItems = items.filter((i) => i.priority).slice(0, 4)
  const nonPriorityIds = new Set(items.filter((i) => !i.priority).map((i) => i.id))
  const moreIsActive = nonPriorityIds.has(activeTab)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden" aria-label="Mobile navigation">
        <div className="grid h-16 grid-cols-5 gap-1 px-2">
          {priorityItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => navigateToPanel(item.id)}
              className={`h-14 min-h-11 min-w-11 flex-col gap-1 rounded-xl px-1 ${activeTab === item.id ? 'text-primary' : 'text-foreground/90'}`}
            >
              <span className="size-5">{item.icon}</span>
              <span className="truncate text-xs font-medium">{item.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            onClick={() => setSheetOpen(true)}
            className={`relative h-14 min-h-11 min-w-11 flex-col gap-1 rounded-xl px-1 ${moreIsActive ? 'text-primary' : 'text-foreground/90'}`}
          >
            <span className="size-5">⋯</span>
            <span className="text-xs font-medium">{tn('more')}</span>
            {moreIsActive && <span className="absolute right-3 top-2 size-2 rounded-full bg-primary" />}
          </Button>
        </div>
      </nav>

      <MobileBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        activeTab={activeTab}
        navigateToPanel={navigateToPanel}
        groups={groups}
      />
    </>
  )
}

function MobileBottomSheet({ open, onClose, activeTab, navigateToPanel, groups }: {
  open: boolean
  onClose: () => void
  activeTab: string
  navigateToPanel: (tab: string) => void
  groups: NavGroup[]
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    else setVisible(false)
  }, [open])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div className={`absolute inset-0 bg-background/50 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border border-border bg-card pb-6 pt-2 safe-area-bottom transition-transform duration-200 ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        <div className="space-y-4 px-4">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className={groupIndex > 0 ? 'border-t border-border pt-4' : ''}>
              <p className="px-1 pb-2 text-xs font-semibold tracking-widest text-muted-foreground">{group.label || 'CORE'}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.flatMap((item) => item.children ? item.children : [item]).map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => {
                      navigateToPanel(item.id)
                      handleClose()
                    }}
                    className={`h-12 min-h-11 justify-start gap-2 rounded-xl px-3 text-left ${activeTab === item.id ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary/70'}`}
                  >
                    <span className="size-5 shrink-0">{item.icon}</span>
                    <span className="truncate text-sm font-medium">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
