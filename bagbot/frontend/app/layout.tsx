import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/context/SidebarContext';

export const metadata: Metadata = {
  title: 'BagBot',
  description: 'Automated trading platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
