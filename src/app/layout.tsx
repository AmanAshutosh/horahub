import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { APP } from '@/config';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: `${APP.name} — Jyotiṣa Engine`, template: `%s · ${APP.name}` },
  description: APP.description,
  robots: { index: true, follow: true },
  openGraph: { title: APP.name, description: APP.description, type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
