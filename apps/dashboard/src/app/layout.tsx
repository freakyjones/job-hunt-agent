import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agentic Job Hunt Dashboard',
  description: 'A secure dashboard for your Zero-Cost Job Hunt Agent',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--text-high-contrast)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-sans)',
            },
            success: {
              iconTheme: {
                primary: 'var(--success)',
                secondary: 'var(--bg-surface)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--danger)',
                secondary: 'var(--bg-surface)',
              },
            },
          }}
        />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
