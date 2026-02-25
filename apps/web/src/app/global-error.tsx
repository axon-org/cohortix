'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import { Button } from '@/components/ui/button';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <head>
        <title>Error - Cohortix</title>
      </head>
      <body className={inter.className}>
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-4xl font-bold">Something went wrong!</h1>
          <p className="text-muted-foreground">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
