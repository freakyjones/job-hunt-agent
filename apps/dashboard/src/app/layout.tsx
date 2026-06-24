import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentic Job Hunt Dashboard",
  description: "A secure dashboard for your Zero-Cost Job Hunt Agent",
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
        <Toaster position="bottom-right" />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
