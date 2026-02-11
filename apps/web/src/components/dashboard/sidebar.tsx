'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutGrid,
  Users,
  BarChart3,
  DollarSign,
  Zap,
  Settings,
  Rocket,
  User as UserIcon,
} from 'lucide-react'

const navigation = [
  { name: 'Mission Control', href: '/', icon: LayoutGrid },
  { name: 'Cohorts', href: '/cohorts', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Revenue', href: '/revenue', icon: DollarSign },
  { name: 'Automations', href: '/automations', icon: Zap },
]

interface SidebarProps {
  user: any
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  // Extract user display info
  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const avatarUrl = user?.profile?.avatar_url

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo - Monochrome */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          <Rocket className="w-6 h-6 text-background" />
        </div>
        <span className="text-xl font-bold">Cohortix</span>
      </div>

      {/* Navigation - Monochrome with white glow */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all relative',
                isActive
                  ? 'text-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-foreground before:shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                  : 'text-muted-foreground hover:text-foreground hover:shadow-[0_0_5px_rgba(255,255,255,0.2)]'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
