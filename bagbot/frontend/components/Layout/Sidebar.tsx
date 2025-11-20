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
  ChevronRight,
  LogOut,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Add admin panel to navigation if user is admin
  const navItems: NavigationItem[] = user?.role === 'admin' 
    ? [...navigationItems, { name: 'Admin Panel', href: '/admin', icon: Shield } as NavigationItem]
    : navigationItems;

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
      className="relative bg-gradient-to-b from-[#2A1721]/95 via-[#1A0E15]/95 to-[#2A1721]/95 backdrop-blur-xl border-r border-[#C75B7A]/20 min-h-screen shadow-2xl"
      style={{
        boxShadow: '4px 0 30px rgba(199, 91, 122, 0.2), inset -1px 0 0 rgba(249, 217, 73, 0.1)',
      }}
    >
      {/* Collapse Toggle Button */}
      <motion.button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 z-50 w-6 h-6 bg-gradient-to-br from-[#C75B7A]/30 to-[#F9D949]/20 border border-[#E5B299]/40 rounded-full flex items-center justify-center hover:from-[#C75B7A]/50 hover:to-[#F9D949]/30 transition-all shadow-lg hover:shadow-[#F9D949]/40 backdrop-blur-sm"
        whileHover={{ scale: 1.15, rotate: 10 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="w-3 h-3 text-[#FFF8E7]" />
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
                <p className="text-xs text-[#F5D5C0] font-medium uppercase tracking-wider">
                  Professional Trading Platform
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.href;

            return (
              <motion.button
                key={item.name}
                onClick={() => onNavigate(item.href)}
                className={`
                  relative w-full flex items-center px-4 py-3 rounded-xl
                  text-left transition-all duration-300 overflow-hidden group
                  ${isActive
                    ? 'bg-gradient-to-r from-[#C75B7A]/30 via-[#F9D949]/15 to-[#E5B299]/20 shadow-xl shadow-[#C75B7A]/20 border border-[#F9D949]/30'
                    : 'hover:bg-gradient-to-r hover:from-[#C75B7A]/15 hover:to-[#F9D949]/10 hover:shadow-lg hover:border hover:border-[#E5B299]/20'
                  }
                `}
                whileHover={{ x: 6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Glowing Left Border (Active Item) */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F9D949] via-[#C75B7A] to-[#E5B299] rounded-r-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      boxShadow: '0 0 20px rgba(249, 217, 73, 0.8), 0 0 40px rgba(199, 91, 122, 0.5), 0 0 8px rgba(229, 178, 153, 0.7)',
                    }}
                  />
                )}

                {/* Icon with Maroon Gradient */}
                <motion.div
                  className={`
                    relative flex-shrink-0 
                    ${isActive 
                      ? 'text-[#F9D949]' 
                      : 'text-[#D4B5C4] group-hover:text-[#F5D5C0]'
                    }
                  `}
                  whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                  style={{
                    filter: isActive 
                      ? 'drop-shadow(0 0 10px rgba(249, 217, 73, 0.7))'
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
                          font-semibold text-sm
                          ${isActive ? 'text-[#FFF8E7]' : 'text-[#F5E6D3]'}
                          group-hover:text-[#FFF8E7] transition-colors
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
                          <div className="px-1.5 py-0.5 bg-gradient-to-r from-[#F9D949] to-[#FDE68A] rounded-full shadow-lg shadow-[#F9D949]/50">
                            <span className="text-[10px] font-bold text-[#0F0810]">
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
              className="mt-8 pt-4 border-t border-[#C75B7A]/20"
            >
              {/* User Profile Section */}
              {user && (
                <div className="px-3 mb-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1A0E15]/50 border border-[#C75B7A]/30 hover:border-[#F9D949]/50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C75B7A] to-[#F9D949] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#FFF8E7]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-[#FFF8E7]">{user.name}</p>
                        <p className="text-xs text-[#D4B5C4] truncate">{user.email}</p>
                      </div>
                    </button>

                    {/* User Menu Dropdown */}
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-[#2A1721]/95 border border-[#C75B7A]/30 backdrop-blur-xl shadow-2xl"
                        >
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <div className="px-4 py-2">
                <p className="text-xs text-[#E5B299] font-medium">
                  Version 1.0.0
                </p>
                <p className="text-xs text-[#D4B5C4] mt-1">
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
