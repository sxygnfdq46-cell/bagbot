'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/providers';

interface NeonTab {
  id: string;
  label: string;
  icon?: string;
}

interface NeonTabsProps {
  tabs: NeonTab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function NeonTabs({
  tabs,
  defaultTab,
  onChange,
  className = '',
}: NeonTabsProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="px-6 py-3 rounded-t transition-all duration-300 font-medium"
            style={{
              background: isActive
                ? 'rgba(0, 246, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isActive ? theme.border.active : theme.border.subtle}`,
              borderBottom: isActive ? 'none' : undefined,
              color: isActive ? theme.colors.neonCyan : theme.text.secondary,
              boxShadow: isActive ? theme.shadows.glow.cyan : 'none',
            }}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
