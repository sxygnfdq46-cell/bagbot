export const grid = {
  // Grid Gap Sizes
  gap: {
    none: '0',
    xs: '0.5rem',     // 8px
    sm: '0.75rem',    // 12px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
  },
  
  // Column Counts
  columns: {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    6: 6,
    8: 8,
    12: 12,
  },
  
  // Responsive Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Common Grid Templates
  templates: {
    dashboard: {
      desktop: 'repeat(12, 1fr)',
      tablet: 'repeat(8, 1fr)',
      mobile: 'repeat(4, 1fr)',
    },
    sidebar: {
      desktop: '280px 1fr',
      tablet: '240px 1fr',
      mobile: '1fr',
    },
    threeColumn: {
      desktop: 'repeat(3, 1fr)',
      tablet: 'repeat(2, 1fr)',
      mobile: '1fr',
    },
    twoColumn: {
      desktop: 'repeat(2, 1fr)',
      mobile: '1fr',
    },
  },
};

export type GridGapKey = keyof typeof grid.gap;
export type GridColumnsKey = keyof typeof grid.columns;
export type GridBreakpointKey = keyof typeof grid.breakpoints;
export type GridTemplateKey = keyof typeof grid.templates;

export const getGridGap = (size: GridGapKey = 'md'): string => {
  return grid.gap[size];
};

export const getGridColumns = (count: GridColumnsKey = 12): number => {
  return grid.columns[count];
};

export const getGridTemplate = (
  template: GridTemplateKey = 'dashboard',
  breakpoint: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): string => {
  const templateData = grid.templates[template];
  const breakpointValue = breakpoint in templateData 
    ? templateData[breakpoint as keyof typeof templateData]
    : templateData.desktop;
  return breakpointValue || grid.templates.dashboard.desktop;
};

// CSS Grid Utility Styles
export const gridStyles = {
  container: {
    display: 'grid',
    width: '100%',
  },
  
  centered: {
    display: 'grid',
    placeItems: 'center',
  },
  
  responsive: (template: GridTemplateKey = 'dashboard') => {
    const templateData = grid.templates[template];
    return {
      display: 'grid',
      gridTemplateColumns: templateData.desktop,
      gap: grid.gap.lg,
      '@media (max-width: 1024px)': {
        gridTemplateColumns: ('tablet' in templateData ? templateData.tablet : templateData.desktop),
        gap: grid.gap.md,
      },
      '@media (max-width: 640px)': {
        gridTemplateColumns: templateData.mobile || ('tablet' in templateData ? templateData.tablet : undefined) || templateData.desktop,
        gap: grid.gap.sm,
      },
    };
  },
};
