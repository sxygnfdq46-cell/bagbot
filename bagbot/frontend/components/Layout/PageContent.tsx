'use client';

import React from 'react';
import { useSidebar } from '@/context/SidebarContext';

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContent({ children, className = '' }: PageContentProps) {
  const { sidebarCollapsed } = useSidebar();

  return (
    <div 
      className={`
        min-h-screen bg-black
        pt-16 md:pt-0
        px-4 py-6
        sm:px-6 sm:py-8
        md:px-8 md:py-8 
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
        overflow-x-hidden
        ${className}
      `}
    >
      <div className="max-w-[1920px] mx-auto">
        {children}
      </div>
    </div>
  );
}
