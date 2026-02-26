import { redirect } from 'next/navigation';
import { getAuthContextBasic } from '@/lib/auth-helper';
import { UnauthorizedError } from '@/lib/errors';
import Link from 'next/link';
import { AccountNav } from './account-nav';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  try {
    await getAuthContextBasic();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          ← Back
        </Link>
        <div className="h-4 w-[1px] bg-border" />
        <h1 className="text-sm font-semibold">Account</h1>
      </header>
      <main className="flex-1 space-y-4 p-8 pt-6 max-w-4xl mx-auto w-full">
        <AccountNav />
        {children}
      </main>
    </div>
  );
}
