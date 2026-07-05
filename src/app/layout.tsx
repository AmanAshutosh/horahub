import type { Metadata } from 'next';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { APP } from '@/config';
import { Footer } from '@/components/layout/Footer';

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

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}>
      <body className="font-sans text-ink antialiased flex flex-col min-h-dvh">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
