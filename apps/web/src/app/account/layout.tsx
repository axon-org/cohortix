import { redirect } from 'next/navigation';
import { getAuthContextBasic } from '@/lib/auth-helper';
import { UnauthorizedError } from '@/lib/errors';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border px-6 h-14 flex items-center">
          <Link href="/" className="text-sm font-medium hover:text-foreground transition-colors">
            ← Back to Workspace
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
