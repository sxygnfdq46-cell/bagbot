'use client';

import { cn } from '@/utils/cn';
import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface NeonTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  glow?: 'cyan' | 'magenta' | 'yellow' | 'green';
  className?: string;
}

const glowStyles = {
  cyan: 'border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]',
  magenta: 'border-neon-magenta text-neon-magenta shadow-[0_0_10px_rgba(255,0,255,0.5)]',
  yellow: 'border-neon-yellow text-neon-yellow shadow-[0_0_10px_rgba(255,255,0,0.5)]',
  green: 'border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,0,0.5)]',
};

export function NeonTabs({
  tabs,
  activeTab,
  onTabChange,
  glow = 'cyan',
  className
}: NeonTabsProps) {
  return (
    <div className={cn('flex gap-2 border-b border-gray-800 px-4', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative px-4 py-3 font-medium transition-all duration-200',
              'flex items-center gap-2',
              'border-b-2',
              isActive
                ? glowStyles[glow]
                : 'border-transparent text-gray-400 hover:text-white'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-700 text-gray-300'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
