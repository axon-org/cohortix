'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Overview', href: '/account' },
  { name: 'Profile', href: '/account/profile' },
  { name: 'Preferences', href: '/account/preferences' },
  { name: 'Security', href: '/account/security' },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-6 border-b border-border mb-8">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
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
