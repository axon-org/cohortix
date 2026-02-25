'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { OrgSwitcher } from './org-switcher';
import {
  LayoutGrid,
  Users,
  Bot,
  Target,
  Settings,
  UserCircle,
  User as UserIcon,
  ChevronLeft,
  FolderKanban,
  CheckSquare,
  Inbox as InboxIcon,
  Compass,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  user: any;
  orgSlug: string;
}

type NavigationItem =
  | {
      name: string;
      href: string;
      icon: LucideIcon;
      badge?: string;
      type?: never;
      label?: never;
    }
  | {
      type: 'divider';
      label?: string;
      name?: never;
      href?: never;
      icon?: never;
      badge?: never;
    };

const getNavigation = (orgSlug: string): NavigationItem[] => [
  // Strategy
  { type: 'divider', label: 'Strategy' },
  { name: 'Visions', href: `/${orgSlug}/visions`, icon: Compass },
  { name: 'Missions', href: `/${orgSlug}/missions`, icon: Target },
  // Execution
  { type: 'divider', label: 'Execution' },
  { name: 'Operations', href: `/${orgSlug}/operations`, icon: FolderKanban },
  { name: 'My Tasks', href: `/${orgSlug}/my-tasks`, icon: CheckSquare },
  { name: 'Inbox', href: `/${orgSlug}/inbox`, icon: InboxIcon, badge: 'Soon' },
  // Team
  { type: 'divider', label: 'Team' },
  { name: 'Cohorts', href: `/${orgSlug}/cohorts`, icon: Users },
  { name: 'Agents', href: `/${orgSlug}/agents`, icon: Bot },
];

const getBottomNavigation = (orgSlug: string): NavigationItem[] => [
  { name: 'Settings', href: `/${orgSlug}/settings`, icon: Settings },
  { name: 'Account', href: '/account', icon: UserCircle },
];

export function Sidebar({ user, orgSlug }: SidebarProps) {
  const pathname = usePathname() ?? '/';
  const [collapsed, setCollapsed] = useState(false);

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const avatarUrl = user?.profile?.avatar_url;

  const navigation = getNavigation(orgSlug);
  const bottomNavigation = getBottomNavigation(orgSlug);

  return (
    <div
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        'bg-card-elevated border-r border-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Org switcher header */}
      <div className="flex items-center gap-2.5 px-2 h-14 border-b border-border">
        {!collapsed ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <OrgSwitcher collapsed={collapsed} />
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-expanded={!collapsed}
              aria-label="Toggle sidebar"
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <OrgSwitcher collapsed={collapsed} />
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-expanded={!collapsed}
              aria-label="Toggle sidebar"
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navigation.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div key={`divider-${index}`} className="pt-3 pb-1">
                {!collapsed && item.label && (
                  <p className="px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    {item.label}
                  </p>
                )}
                {collapsed && <div className="h-px bg-border mx-2" />}
              </div>
            );
          }

          const isActive =
            item.href === `/${orgSlug}` || item.href === '/account'
              ? pathname === item.href
              : pathname.startsWith(item.href);
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
              {!collapsed && (
                <span className="flex items-center gap-2">
                  {item.name}
                  {item.badge && (
                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom navigation - Settings & Account */}
      <div className="px-2 pb-1 space-y-0.5" aria-label="Settings">
        {bottomNavigation.map((item) => {
          if (item.type === 'divider') return null;
          const isActive =
            item.href === '/account' ? pathname === item.href : pathname.startsWith(item.href!);
          const Icon = item.icon!;
          return (
            <Link
              key={item.name}
              href={item.href!}
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
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={28}
              height={28}
              className="rounded-full object-cover flex-shrink-0"
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
