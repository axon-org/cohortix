'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, ChevronRight } from 'lucide-react';

interface HeaderProps {
  user: any;
}

function useBreadcrumbs() {
  const pathname = usePathname() ?? '/';
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/dashboard' }];
  }

  const crumbs: { label: string; href: string }[] = [];
  let path = '';

  for (const segment of segments) {
    path += `/${segment}`;
    // If it looks like a UUID, label it as "Detail"
    const isUuid = /^[0-9a-f]{8}-/.test(segment);
    const label = isUuid ? 'Detail' : segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function Header({ user }: HeaderProps) {
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="h-12 border-b border-border bg-[#111113] px-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
        </button>
      </div>
    </header>
  );
}
