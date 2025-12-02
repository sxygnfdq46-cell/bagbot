'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";
import Button from "@/components/ui/button";
import { NAV_ITEMS } from "@/components/ui/nav-config";
import { useAuthToken } from "@/app/store/auth-store";
import { Menu, X } from "lucide-react";

const HIDDEN_ROUTES = ["/login"];

export default function Navbar() {
  const pathname = usePathname();
  const [timestamp, setTimestamp] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { role } = useAuthToken();

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresRole || item.requiresRole === role),
    [role]
  );

  useEffect(() => {
    const updateTime = () =>
      setTimestamp(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    updateTime();
    const interval = setInterval(updateTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mobileNavOpen) {
      document.documentElement.classList.add('overflow-hidden');
    } else {
      document.documentElement.classList.remove('overflow-hidden');
    }
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [mobileNavOpen]);

  if (HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  const navLinks = (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base">
      {visibleItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${active ? 'nav-link--active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="flex items-center gap-1.5">
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );

  const systemControls = (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button
        variant="ghost"
        className="w-full justify-center text-xs uppercase tracking-[0.3em] text-[color:var(--accent-cyan)] lg:w-auto"
      >
        System {timestamp || '— —'}
      </Button>
      <div className="w-full lg:w-auto">
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <nav className="nav-shell sticky top-0 z-30 flex flex-col gap-4 border-b border-[color:var(--border-soft)] bg-base px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-5">
      <div className="flex w-full items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-3 text-center lg:text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--border-soft)] bg-card text-xl font-bold text-[color:var(--accent-gold)] shadow-card">
            B
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-green)]">BagBot</p>
            <h1 className="page-title text-lg font-semibold">Intelligence Terminal</h1>
          </div>
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[color:var(--text-main)] lg:hidden"
          aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((prev) => !prev)}
        >
          {mobileNavOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <div className="hidden flex-1 flex-wrap items-center justify-center gap-4 lg:flex">
        {navLinks}
      </div>
      <div className="hidden items-center gap-4 lg:flex">
        {systemControls}
      </div>

      {mobileNavOpen && (
        <div className="nav-overlay fixed inset-0 z-40 bg-[color:var(--scrim)] backdrop-blur-xl lg:hidden" role="dialog" aria-modal="true">
          <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--accent-gold)]">Navigation</p>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[color:var(--text-main)]"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-[color:var(--text-main)]">
              {visibleItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-[0.9rem] border px-4 py-3 transition-all ${
                      active
                        ? 'border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] shadow-glow'
                        : 'border-[color:var(--border-soft)] text-[color:var(--text-main)] opacity-80 hover:opacity-100'
                    }`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <span className="flex items-center gap-3 text-base">
                      <Icon className="h-5 w-5" aria-hidden />
                      {item.label}
                    </span>
                    {active && <span className="text-xs uppercase tracking-[0.35em]">Active</span>}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto flex flex-col gap-4">
              {systemControls}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
