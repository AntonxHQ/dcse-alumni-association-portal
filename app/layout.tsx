import './globals.css';

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Alumni Portal',
  description: 'DCSE Alumni Portal',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={`dark ${inter.variable} ${jetBrainsMono.variable}`}
      lang="en"
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'bg-surface-200 border border-default text-foreground text-sm',
              error: 'text-destructive border-destructive/30',
              success: 'border-brand/30',
            },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
