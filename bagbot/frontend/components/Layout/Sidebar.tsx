'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Zap, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  isNew?: boolean;
}

interface SidebarProps {
  activeRoute: string;
  onNavigate: (href: string) => void;
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Charts', href: '/charts', icon: TrendingUp },
  { name: 'Signals', href: '/signals', icon: Zap },
  { name: 'Logs', href: '/logs', icon: FileText, badge: 3, isNew: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

/**
 * Enhanced Collapsible Sidebar Component
 * Features:
 * - Smooth collapse/expand animation
 * - Glowing yellow left border on active items
 * - Hover slide-in effect for labels
 * - Maroon gradient icons
 * - Update badges for notifications
 * - Responsive design
 */
const Sidebar: React.FC<SidebarProps> = ({ activeRoute, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.nav
      initial={false}
      animate={{
        width: isCollapsed ? '80px' : '256px',
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      className="relative bg-gradient-to-b from-amber-950/40 via-yellow-950/30 to-amber-900/40 backdrop-blur-xl border-r border-amber-500/20 min-h-screen shadow-2xl"
      style={{
        boxShadow: '4px 0 24px rgba(251, 191, 36, 0.15), inset -1px 0 0 rgba(253, 185, 26, 0.1)',
      }}
    >
      {/* Collapse Toggle Button */}
      <motion.button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 z-50 w-6 h-6 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-400/30 rounded-full flex items-center justify-center hover:bg-amber-500/30 transition-all shadow-md hover:shadow-amber-500/30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="w-3 h-3 text-amber-300" />
        </motion.div>
      </motion.button>

      <div className="p-4">
        {/* Professional Trading Platform Header */}
        <div className="mb-6 px-2">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-amber-300/80 font-medium uppercase tracking-wider">
                  Professional Trading Platform
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                    Live
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.href;

            return (
              <motion.button
                key={item.name}
                onClick={() => onNavigate(item.href)}
                className={`
                  relative w-full flex items-center px-4 py-3 rounded-lg
                  text-left transition-all duration-300 overflow-hidden group
                  ${isActive
                    ? 'bg-gradient-to-r from-amber-400/25 via-yellow-500/20 to-amber-500/15 shadow-lg shadow-amber-500/20 border border-amber-400/30'
                    : 'hover:bg-amber-500/10 hover:shadow-md hover:border hover:border-amber-500/20'
                  }
                `}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Glowing Left Border (Active Item) */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-r-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      boxShadow: '0 0 24px rgba(253, 185, 26, 0.7), 0 0 48px rgba(253, 185, 26, 0.4), 0 0 8px rgba(255, 207, 64, 0.9)',
                    }}
                  />
                )}

                {/* Icon with Maroon Gradient */}
                <motion.div
                  className={`
                    relative flex-shrink-0 
                    ${isActive 
                      ? 'text-amber-400' 
                      : 'text-amber-300/60 group-hover:text-amber-300'
                    }
                  `}
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                  style={{
                    filter: isActive 
                      ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))'
                      : 'none',
                  }}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {/* Maroon gradient overlay on icons */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-amber-900/10 rounded mix-blend-overlay pointer-events-none"
                      style={{ opacity: isActive ? 0.3 : 0.1 }}
                    />
                  </div>
                </motion.div>

                {/* Label with Slide-in Effect */}
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between flex-1 ml-3"
                    >
                      <span
                        className={`
                          font-medium text-sm
                          ${isActive ? 'text-amber-200' : 'text-amber-100/80'}
                          group-hover:text-amber-200 transition-colors
                        `}
                      >
                        {item.name}
                      </span>

                      {/* Update Badge */}
                      {item.badge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: 'spring',
                            stiffness: 500,
                            damping: 15 
                          }}
                          className="relative"
                        >
                          <div className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full">
                            <span className="text-[10px] font-bold text-black">
                              {item.badge}
                            </span>
                          </div>
                          {/* Pulsing glow for new items */}
                          {item.isNew && (
                            <motion.div
                              className="absolute inset-0 bg-amber-500 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            />
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed State Badge */}
                {isCollapsed && item.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center"
                    style={{
                      boxShadow: '0 0 10px rgba(240, 185, 11, 0.5)',
                    }}
                  >
                    <span className="text-[8px] font-bold text-black">
                      {item.badge}
                    </span>
                  </motion.div>
                )}

                {/* Hover Slide Effect Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent rounded-lg"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ zIndex: -1 }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Navigation Footer */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="mt-8 pt-4 border-t border-amber-500/20"
            >
              <div className="px-4 py-2">
                <p className="text-xs text-amber-300/70 font-medium">
                  Version 1.0.0
                </p>
                <p className="text-xs text-amber-300/50 mt-1">
                  © 2025 BagBot
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Sidebar;
