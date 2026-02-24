import Link from 'next/link';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace configuration</p>
      </div>

      <nav className="flex gap-4 border-b border-border">
        <NavLink href={`/${orgSlug}/settings`}>General</NavLink>
        <NavLink href={`/${orgSlug}/settings/members`}>Members</NavLink>
        <NavLink href={`/${orgSlug}/settings/billing`}>Billing</NavLink>
        <NavLink href={`/${orgSlug}/settings/integrations`}>Integrations</NavLink>
      </nav>

      <div>{children}</div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
