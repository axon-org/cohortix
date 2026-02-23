'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Users,
  Bot,
  Rocket,
  Settings,
  User as UserIcon,
  ChevronLeft,
  FolderKanban,
  CheckSquare,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Cohorts', href: '/dashboard/cohorts', icon: Users },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Missions', href: '/dashboard/missions', icon: Rocket },
  { name: 'Operations', href: '/dashboard/operations', icon: FolderKanban },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
];

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname() ?? '/';
  const [collapsed, setCollapsed] = useState(false);

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const avatarUrl = user?.profile?.avatar_url;
  const orgName = user?.profile?.organization_name || 'Cohortix';

  return (
    <div
      className={cn(
        'bg-[#111113] border-r border-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Org header */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
        <div className="w-7 h-7 bg-foreground rounded-md flex items-center justify-center flex-shrink-0">
          <Rocket className="w-4 h-4 text-background" />
        </div>
        {!collapsed && <span className="text-sm font-semibold truncate">{orgName}</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'ml-auto p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors',
            collapsed && 'ml-0'
          )}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all relative group',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground rounded-r" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-2 py-2 border-t border-border">
        <Link
          href="/dashboard/settings"
          title={collapsed ? 'Settings' : undefined}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
