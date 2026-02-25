'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'General', href: '' }, // Root of settings
  { name: 'Members', href: '/members' },
  { name: 'Billing', href: '/billing' },
  { name: 'Integrations', href: '/integrations' },
];

export function SettingsNav() {
  const pathname = usePathname();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;

  return (
    <nav className="flex space-x-6 border-b border-border mb-8">
      {navItems.map((item) => {
        const href = `/${orgSlug}/settings${item.href}`;
        const isActive = pathname === href;

        return (
          <Link
            key={item.name}
            href={href}
            className={cn(
              'pb-3 text-sm font-medium transition-colors border-b-2',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
