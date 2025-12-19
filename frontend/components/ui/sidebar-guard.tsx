"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function SidebarGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith("/terminal");

  if (hideSidebar) return null;
  return <>{children}</>;
}
