'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, ChevronRight, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

interface HeaderProps {
  user: any;
  orgSlug: string;
}

function useBreadcrumbs() {
  const pathname = usePathname() ?? '/';
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/' }];
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

export function Header({ user, orgSlug }: HeaderProps) {
  const breadcrumbs = useBreadcrumbs();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="h-12 border-b border-border bg-[#111113] px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -ml-2 md:hidden text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60">
            <Sidebar user={user} orgSlug={orgSlug} />
          </SheetContent>
        </Sheet>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
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

        {/* Mobile Page Title fallback when breadcrumbs hidden */}
        <span className="sm:hidden font-medium text-foreground text-sm">
          {breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
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
