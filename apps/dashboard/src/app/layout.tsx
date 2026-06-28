import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

const outfit = Outfit({ subsets: ['latin'], display: 'swap' });

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
        <ClientProviders />
      </body>
    </html>
  );
}
