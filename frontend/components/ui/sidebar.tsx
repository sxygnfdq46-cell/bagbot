'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/ui/nav-config";
import { useAuthToken } from "@/app/store/auth-store";
import ThemeToggle from "@/components/ui/theme-toggle";
import { Menu, X } from "lucide-react";

const HIDDEN_ROUTES = ["/login"];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role } = useAuthToken();

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresRole || item.requiresRole === role),
    [role]
  );

  useEffect(() => {
    if (!mobileOpen) return;
    document.documentElement.classList.add('overflow-hidden');
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [mobileOpen]);

  if (HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-2">
      {visibleItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-pill ${active ? 'nav-pill--active' : ''}`}
            onClick={() => {
              onNavigate?.();
            }}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  const toggleBlock = (
    <div className="mt-auto space-y-3">
      <p className="metric-label text-[color:var(--accent-gold)]">Ambience</p>
      <ThemeToggle className="justify-between" />
    </div>
  );

  return (
    <>
      <aside className="sidebar-shell sticky top-0 hidden h-screen w-64 flex-col border-r border-[color:var(--border-soft)] bg-base p-6 backdrop-blur-xl lg:flex">
        <div className="mb-10 text-xs uppercase tracking-[0.4em] text-[color:var(--accent-gold)]">
          Control
        </div>
        {navList()}
        {toggleBlock}
      </aside>

      <button
        type="button"
        className="fixed bottom-6 left-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-base text-[color:var(--text-main)] shadow-card lg:hidden"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex flex-col bg-[color:var(--scrim)]/70 backdrop-blur-xl lg:hidden" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-5 pt-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--accent-gold)]">Control</p>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[color:var(--text-main)]"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6">
            {navList(() => setMobileOpen(false))}
            {toggleBlock}
          </div>
        </div>
      )}
    </>
  );
}
