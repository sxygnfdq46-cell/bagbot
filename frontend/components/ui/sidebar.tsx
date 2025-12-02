'use client';

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/ui/nav-config";
import { useAuthToken } from "@/app/store/auth-store";

const HIDDEN_ROUTES = ["/login"];

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuthToken();

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresRole || item.requiresRole === role),
    [role]
  );

  if (HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <aside className="sidebar-shell sticky top-0 hidden h-screen w-64 flex-col border-r border-[color:var(--border-soft)] bg-base p-6 backdrop-blur-xl lg:flex">
      <div className="mb-10 text-xs uppercase tracking-[0.4em] text-[color:var(--accent-gold)]">
        Control
      </div>
      <nav className="flex flex-col gap-2">
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill ${active ? 'nav-pill--active' : ''}`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
