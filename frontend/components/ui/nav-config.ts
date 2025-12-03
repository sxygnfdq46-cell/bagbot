import type { LucideIcon } from 'lucide-react';
import { GaugeCircle, Layers, Radio, Settings, ShieldCheck, Brain, LineChart, Bot } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresRole?: 'admin';
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: GaugeCircle },
  { href: '/strategies', label: 'Strategies', icon: Layers },
  { href: '/signals', label: 'Signals', icon: Radio },
  { href: '/brain', label: 'Brain', icon: Brain },
  { href: '/admin', label: 'Admin', icon: ShieldCheck, requiresRole: 'admin' },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/charts', label: 'Charts', icon: LineChart },
  { href: '/bot', label: 'Bot', icon: Bot }
];
