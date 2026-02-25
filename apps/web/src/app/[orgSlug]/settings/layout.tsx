import type { ReactNode } from 'react';
import { SettingsNav } from './settings-nav';

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization profile, members, and preferences.
        </p>
      </div>

      <SettingsNav />

      <div className="mt-6">{children}</div>
    </div>
  );
}
