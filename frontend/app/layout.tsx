import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import '../styles/theme.css';
import '../styles/responsive.css';
import '../styles/ultra-wide.css';
import '../styles/animations.css';
import '../styles/glow-refinement.css';
import '../styles/shadow-refinement.css';
import '../styles/cognitive-fusion.css';
import '../styles/entity-mode.css';
import '../styles/entity-expression.css';
import '../styles/entity-drift.css';
import '../styles/reflex-visual.css';
import ClientLayoutWrapper from './ClientLayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BagBot 2.0 — Alien Trading Terminal',
  description: 'The world\'s most futuristic sci-fi trading interface',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
