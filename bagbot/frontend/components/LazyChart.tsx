'use client';

import React, { Suspense, lazy } from 'react';
import Skeleton from '@/components/UI/Skeleton';
import { CandlestickData, TechnicalIndicators } from '@/components/MainChart';

// Lazy load the main chart component
const MainChart = lazy(() => import('@/components/MainChart'));

interface LazyChartProps {
  data: CandlestickData[];
  indicators?: TechnicalIndicators;
  config?: any;
  symbol?: string;
  timeframe?: string;
  className?: string;
}

/**
 * LazyChart - Performance-optimized chart loader
 * Lazy loads chart component to reduce initial bundle size
 */
export const LazyChart: React.FC<LazyChartProps> = (props) => {
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height="24rem" />}>
      <MainChart {...props} />
    </Suspense>
  );
};

export default LazyChart;
