"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Threat Center", href: "/threat-center", icon: "🛡️" },
  ];

  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg font-semibold transition-all backdrop-blur-sm ${
            pathname === item.href
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50"
              : "bg-black/30 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20"
          }`}
        >
          <span className="mr-2">{item.icon}</span>
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
