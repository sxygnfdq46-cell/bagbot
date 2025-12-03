import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import "@/styles/globals.css";
import Sidebar from "@/components/ui/sidebar";
import AppProviders from "@/components/app-providers";
import PageTransition from "@/components/ui/page-transition";
import GlobalBagbotInscription from "@/components/global-bagbot-inscription";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "BagBot Terminal",
  description: "Reimagined BagBot frontend — clean, premium, and precise."
};

const themeInitScript = `(() => {
  const STORAGE_KEY = 'bagbot-theme';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next === 'dark' ? 'dark' : 'light';
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <Script id="theme-mode-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className={`${inter.variable} bg-base text-text-main`}>
        <AppProviders>
          <div className="layout-shell">
            <Sidebar />
            <div className="layout-main">
              <GlobalBagbotInscription />
              <main className="layout-content">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
