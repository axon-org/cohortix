import { Button } from '@/components/ui/button'
import type { NavItem } from './types'

export function NavItemButton({ item, active, expanded, onClick, onPrefetch, nested }: {
  item: NavItem
  active: boolean
  expanded: boolean
  onClick: () => void
  onPrefetch?: () => void
  nested?: boolean
}) {
  if (expanded) {
    return (
      <Button
        variant="ghost"
        onClick={onClick}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        aria-current={active ? 'page' : undefined}
        className={`group relative w-full justify-start gap-3 rounded-xl px-3 text-left transition-colors ${nested ? 'h-11 text-xs' : 'h-11 text-sm'} ${
          active
            ? 'bg-primary/15 text-primary hover:bg-primary/20'
            : 'text-foreground hover:bg-secondary/70 hover:text-foreground'
        }`}
      >
        {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
        <span className={`shrink-0 ${nested ? 'size-4' : 'size-5'}`}>{item.icon}</span>
        <span className="truncate font-medium">{item.label}</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      className={`group relative rounded-xl ${
        active ? 'bg-primary/15 text-primary hover:bg-primary/20' : 'text-foreground/90 hover:bg-secondary/70 hover:text-foreground'
      }`}
    >
      <span className="size-5">{item.icon}</span>
      <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {item.label}
      </span>
      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
    </Button>
  )
}
