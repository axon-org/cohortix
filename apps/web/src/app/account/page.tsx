import { User, Bell, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal account preferences
        </p>
      </div>

      <div className="grid gap-4">
        <SettingCard
          icon={<User className="w-5 h-5" />}
          title="Profile"
          description="Update your name, avatar, and email"
          href="/account/profile"
        />
        <SettingCard
          icon={<Bell className="w-5 h-5" />}
          title="Preferences"
          description="Theme, notifications, and language"
          href="/account/preferences"
        />
        <SettingCard
          icon={<Shield className="w-5 h-5" />}
          title="Security"
          description="Password, 2FA, and active sessions"
          href="/account/security"
        />
      </div>
    </div>
  );
}

function SettingCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:border-foreground/20 transition-colors group"
    >
      <div className="p-3 bg-secondary rounded-md text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
