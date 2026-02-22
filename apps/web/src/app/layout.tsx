import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cohortix - Your AI crew, ready for action',
  description: 'Allies-as-a-Service platform for managing high-performing AI teams',
};

const allowedRedirectOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
].filter(Boolean) as string[];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider allowedRedirectOrigins={allowedRedirectOrigins}>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
