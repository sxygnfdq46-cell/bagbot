'use client';

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/ui/nav-config";
import { useAuthToken } from "@/app/store/auth-store";
import ThemeToggle from "@/components/ui/theme-toggle";
import { Menu, X } from "lucide-react";

const HIDDEN_ROUTES = ["/login"];
const terminalBasePadding = "1.5rem";
const terminalInlinePadding = "clamp(0rem, 1vw, 1.5rem)";

const drawerSafeAreaStyle: CSSProperties = {
  paddingTop: `calc(${terminalBasePadding} + env(safe-area-inset-top))`,
  paddingBottom: `calc(${terminalBasePadding} + env(safe-area-inset-bottom))`,
  paddingLeft: `calc(${terminalInlinePadding} + env(safe-area-inset-left))`,
  paddingRight: `calc(${terminalInlinePadding} + env(safe-area-inset-right))`,
};

const fabSafeAreaStyle: CSSProperties = {
  bottom: `calc(${terminalBasePadding} + env(safe-area-inset-bottom))`,
  left: `calc(${terminalInlinePadding} + env(safe-area-inset-left))`,
};

export default function Sidebar() {
  const pathname = usePathname();
  const path = pathname ?? '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role } = useAuthToken();

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresRole || item.requiresRole === role),
    [role]
  );

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (mobileOpen) {
      root.classList.add('drawer-active');
      body.classList.add('drawer-active');
    } else {
      root.classList.remove('drawer-active');
      body.classList.remove('drawer-active');
    }
    return () => {
      root.classList.remove('drawer-active');
      body.classList.remove('drawer-active');
    };
  }, [mobileOpen]);

  if (HIDDEN_ROUTES.includes(path)) {
    return null;
  }

  const navList = (onNavigate?: () => void) => (
    <nav className="stack-gap-sm" aria-label="Primary navigation">
      {visibleItems.map((item) => {
        const active = path.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-pill ${active ? 'nav-pill--active' : ''}`}
            aria-current={active ? 'page' : undefined}
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
    <div className="mt-auto stack-gap-xs">
      <p className="metric-label text-[color:var(--accent-gold)]">Ambience</p>
      <ThemeToggle className="justify-between" />
    </div>
  );

  return (
    <>
      <aside className="sidebar-shell hidden w-64 flex-shrink-0 flex-col border-r border-[color:var(--border-soft)] bg-base backdrop-blur-xl lg:flex">
        <div className="stack-gap-lg h-full">
          <div className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-gold)]">
            Control
          </div>
          <div className="stack-gap-md flex-1">
            {navList()}
          </div>
          {toggleBlock}
        </div>
      </aside>

      <button
        type="button"
        className="fixed z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-base text-[color:var(--text-main)] shadow-card lg:hidden"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        style={fabSafeAreaStyle}
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {mobileOpen && (
        <div
          className="drawer-panel fixed inset-0 z-30 flex flex-col bg-[color:var(--scrim)] backdrop-blur-2xl lg:hidden"
          role="dialog"
          aria-modal="true"
          style={drawerSafeAreaStyle}
        >
          <div className="flex items-center justify-between pb-4">
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
          <div className="stack-gap-lg flex-1 overflow-y-auto">
            {navList(() => setMobileOpen(false))}
            {toggleBlock}
          </div>
        </div>
      )}
    </>
  );
}
