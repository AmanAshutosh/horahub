import type { Metadata } from 'next';
import './globals.css';
import { APP } from '@/config';

export const metadata: Metadata = {
  title: { default: `${APP.name} — Jyotiṣa Engine`, template: `%s · ${APP.name}` },
  description: APP.description,
  robots: { index: true, follow: true },
  openGraph: { title: APP.name, description: APP.description, type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-ink antialiased">{children}</body>
    </html>
  );
}
