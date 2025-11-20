/**
 * MainChart Component for BagBot Trading Platform
 * Professional candlestick chart with technical indicators using accessible colors
 */

import React, { useEffect, useRef, useState } from 'react';

/**
 * Candlestick data structure
 */
export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Technical indicator data
 */
export interface TechnicalIndicators {
  ema?: number[];
  sma?: number[];
  rsi?: number[];
  bollinger?: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
}

/**
 * Chart configuration
 */
interface ChartConfig {
  width: number;
  height: number;
  showVolume: boolean;
  showEMA: boolean;
  showSMA: boolean;
  showRSI: boolean;
  showBollinger: boolean;
}

/**
 * Props for MainChart component
 */
interface MainChartProps {
  data: CandlestickData[];
  indicators?: TechnicalIndicators;
  config?: Partial<ChartConfig>;
  symbol?: string;
  timeframe?: string;
  className?: string;
}

/**
 * Chart color scheme using CSS variables and accessible colors
 */
const CHART_COLORS = {
  // Candlestick colors - accessible green/red with good contrast
  bullish: '#1DB954', // Accessible green - var(--color-success) equivalent
  bearish: '#8B0000', // Dark red/maroon for better contrast
  
  // Technical indicator colors using CSS variables
  ema: '#FFC107', // Yellow/accent color for EMA - var(--color-accent)
  sma: 'var(--color-info)', // Blue for SMA
  rsi: 'var(--color-warning)', // Orange for RSI
  
  // Bollinger Band colors
  bollingerUpper: 'var(--color-danger)', // Red for upper band
  bollingerMiddle: 'var(--color-primary)', // Primary color for middle band
  bollingerLower: 'var(--color-success)', // Green for lower band
  
  // Chart infrastructure colors
  gridLines: 'var(--color-border)', // Grid lines using border color
  axisText: 'var(--color-muted)', // Axis labels using muted text
  background: 'var(--color-surface)', // Chart background
  volumeBars: 'var(--color-muted)', // Volume bars
};

/**
 * Default chart configuration
 */
const DEFAULT_CONFIG: ChartConfig = {
  width: 800,
  height: 600,
  showVolume: true,
  showEMA: true,
  showSMA: false,
  showRSI: true,
  showBollinger: false,
};

/**
 * Format price for display
 */
const formatPrice = (price: number): string => {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: number, timeframe: string = '1h'): string => {
  const date = new Date(timestamp);
  
  switch (timeframe) {
    case '1m':
    case '5m':
    case '15m':
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    case '1h':
    case '4h':
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit' 
      });
    case '1d':
    default:
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
  }
};

/**
 * Calculate price change percentage
 */
const calculatePriceChange = (current: number, previous: number): number => {
  return ((current - previous) / previous) * 100;
};

/**
 * MainChart component with accessible styling using design tokens
 */
const MainChart: React.FC<MainChartProps> = ({
  data,
  indicators,
  config: configOverride = {},
  symbol = 'BTC/USDT',
  timeframe = '1h',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  
  const config = { ...DEFAULT_CONFIG, ...configOverride };
  
  // Get latest price data for header
  const latestCandle = data[data.length - 1];
  const previousCandle = data[data.length - 2];
  const priceChange = previousCandle 
    ? calculatePriceChange(latestCandle?.close || 0, previousCandle.close)
    : 0;
  
  /**
   * Draw candlestick chart on canvas
   */
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with surface background color
    ctx.fillStyle = CHART_COLORS.background;
    ctx.fillRect(0, 0, config.width, config.height);
    
    // Calculate chart dimensions
    const padding = 60;
    const chartWidth = config.width - padding * 2;
    const chartHeight = config.height - padding * 2;
    
    // Calculate price range
    const prices = data.flatMap(d => [d.high, d.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Draw grid lines using CSS variable color
    ctx.strokeStyle = CHART_COLORS.gridLines;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw candlesticks with accessible colors
    const candleWidth = chartWidth / data.length * 0.8;
    
    data.forEach((candle, index) => {
      const x = padding + (index * chartWidth) / data.length;
      const openY = padding + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = padding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = padding + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = padding + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
      
      const isBullish = candle.close > candle.open;
      
      // Draw high-low line
      ctx.strokeStyle = isBullish ? CHART_COLORS.bullish : CHART_COLORS.bearish;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();
      
      // Draw open-close body
      ctx.fillStyle = isBullish ? CHART_COLORS.bullish : CHART_COLORS.bearish;
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      
      if (bodyHeight < 1) {
        // Doji candle - draw thin line
        ctx.fillRect(x, bodyY, candleWidth, 1);
      } else {
        ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
      }
    });
    
    // Draw EMA overlay if enabled - using accent color
    if (config.showEMA && indicators?.ema) {
      ctx.strokeStyle = CHART_COLORS.ema; // Using accent yellow color
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      indicators.ema.forEach((ema, index) => {
        if (ema && index < data.length) {
          const x = padding + (index * chartWidth) / data.length + candleWidth / 2;
          const y = padding + chartHeight - ((ema - minPrice) / priceRange) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      
      ctx.stroke();
    }
    
    // Draw SMA overlay if enabled - using info color
    if (config.showSMA && indicators?.sma) {
      ctx.strokeStyle = CHART_COLORS.sma; // Using CSS variable for info color
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      indicators.sma.forEach((sma, index) => {
        if (sma && index < data.length) {
          const x = padding + (index * chartWidth) / data.length + candleWidth / 2;
          const y = padding + chartHeight - ((sma - minPrice) / priceRange) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      
      ctx.stroke();
    }
    
    // Draw Bollinger Bands if enabled
    if (config.showBollinger && indicators?.bollinger) {
      const { upper, middle, lower } = indicators.bollinger;
      
      // Upper band - using danger color
      if (upper) {
        ctx.strokeStyle = CHART_COLORS.bollingerUpper;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        upper.forEach((value, index) => {
          if (value && index < data.length) {
            const x = padding + (index * chartWidth) / data.length + candleWidth / 2;
            const y = padding + chartHeight - ((value - minPrice) / priceRange) * chartHeight;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        
        ctx.stroke();
      }
      
      // Middle band - using primary color
      if (middle) {
        ctx.strokeStyle = CHART_COLORS.bollingerMiddle;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        
        middle.forEach((value, index) => {
          if (value && index < data.length) {
            const x = padding + (index * chartWidth) / data.length + candleWidth / 2;
            const y = padding + chartHeight - ((value - minPrice) / priceRange) * chartHeight;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        
        ctx.stroke();
      }
      
      // Lower band - using success color
      if (lower) {
        ctx.strokeStyle = CHART_COLORS.bollingerLower;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        lower.forEach((value, index) => {
          if (value && index < data.length) {
            const x = padding + (index * chartWidth) / data.length + candleWidth / 2;
            const y = padding + chartHeight - ((value - minPrice) / priceRange) * chartHeight;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
    
    // Draw price labels - using muted text color
    ctx.fillStyle = CHART_COLORS.axisText;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(formatPrice(price), config.width - padding + 5, y + 4);
    }
    
    // Draw time labels
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i += Math.floor(data.length / 6)) {
      if (data[i]) {
        const x = padding + (i * chartWidth) / data.length + candleWidth / 2;
        const timestamp = formatTimestamp(data[i].timestamp, timeframe);
        ctx.fillText(timestamp, x, config.height - 20);
      }
    }
  };
  
  /**
   * Handle mouse move for tooltip
   */
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePos({ x: event.clientX, y: event.clientY });
    
    // Calculate which candle is hovered
    const padding = 60;
    const chartWidth = config.width - padding * 2;
    const candleIndex = Math.floor(((x - padding) / chartWidth) * data.length);
    
    if (candleIndex >= 0 && candleIndex < data.length) {
      setHoveredCandle(data[candleIndex]);
    } else {
      setHoveredCandle(null);
    }
  };
  
  /**
   * Handle mouse leave
   */
  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setMousePos(null);
  };
  
  // Redraw chart when data changes
  useEffect(() => {
    drawChart();
  }, [data, indicators, config]);
  
  return (
    <div className={`relative bg-surface rounded-xl border border-border shadow-custom-lg ${className}`}>
      {/* Chart Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-main">{symbol}</h2>
            <span className="text-sm text-muted uppercase tracking-wide">{timeframe}</span>
          </div>
          
          {latestCandle && (
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-main">
                  {formatPrice(latestCandle.close)}
                </div>
                <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-success' : 'text-danger'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Technical Indicator Legend */}
        <div className="flex items-center space-x-6 mt-4 text-sm">
          {config.showEMA && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.ema }}></div>
              <span className="text-muted">EMA (Yellow)</span>
            </div>
          )}
          {config.showSMA && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-info"></div>
              <span className="text-muted">SMA (Blue)</span>
            </div>
          )}
          {config.showBollinger && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted">Bollinger Bands</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={config.width}
          height={config.height}
          className="block w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Tooltip */}
        {hoveredCandle && mousePos && (
          <div
            className="fixed z-50 bg-surface border border-border rounded-lg shadow-custom-lg p-3 text-sm pointer-events-none"
            style={{
              left: mousePos.x + 10,
              top: mousePos.y - 100,
            }}
          >
            <div className="space-y-1">
              <div className="font-medium text-main">
                {new Date(hoveredCandle.timestamp).toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted">Open:</span>
                <span className="font-mono text-main">{formatPrice(hoveredCandle.open)}</span>
                <span className="text-muted">High:</span>
                <span className="font-mono text-success">{formatPrice(hoveredCandle.high)}</span>
                <span className="text-muted">Low:</span>
                <span className="font-mono text-danger">{formatPrice(hoveredCandle.low)}</span>
                <span className="text-muted">Close:</span>
                <span className="font-mono text-main">{formatPrice(hoveredCandle.close)}</span>
                <span className="text-muted">Volume:</span>
                <span className="font-mono text-muted">{hoveredCandle.volume.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainChart;