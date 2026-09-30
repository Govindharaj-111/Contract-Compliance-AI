import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Autonomous Contract & Compliance Intelligence System (AI-03)',
  description:
    'AI-powered supplier contract compliance, obligation tracking, notice period detection, policy conflict ranking, and evidence-backed contract analysis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
