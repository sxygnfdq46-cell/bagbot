'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Live Ticker Tape Component
 * Displays real-time prices for forex, crypto, stocks, and commodities
 * Auto-scrolling with smooth animations
 */
export default function LiveTickerTape() {
  const [tickers, setTickers] = useState<TickerItem[]>([
    // Cryptocurrencies
    { symbol: 'BTC/USD', name: 'Bitcoin', price: 44250.50, change: 1250.30, changePercent: 2.91 },
    { symbol: 'ETH/USD', name: 'Ethereum', price: 2340.75, change: -45.20, changePercent: -1.89 },
    { symbol: 'BNB/USD', name: 'Binance Coin', price: 305.40, change: 12.15, changePercent: 4.14 },
    { symbol: 'SOL/USD', name: 'Solana', price: 98.23, change: 5.67, changePercent: 6.13 },
    
    // Forex Pairs
    { symbol: 'EUR/USD', name: 'Euro/Dollar', price: 1.0845, change: 0.0023, changePercent: 0.21 },
    { symbol: 'GBP/USD', name: 'Pound/Dollar', price: 1.2634, change: -0.0045, changePercent: -0.35 },
    { symbol: 'USD/JPY', name: 'Dollar/Yen', price: 149.85, change: 0.52, changePercent: 0.35 },
    { symbol: 'AUD/USD', name: 'Aussie/Dollar', price: 0.6523, change: 0.0012, changePercent: 0.18 },
    
    // Stocks
    { symbol: 'AAPL', name: 'Apple', price: 189.95, change: 3.45, changePercent: 1.85 },
    { symbol: 'TSLA', name: 'Tesla', price: 242.84, change: -5.23, changePercent: -2.11 },
    { symbol: 'GOOGL', name: 'Google', price: 141.80, change: 2.15, changePercent: 1.54 },
    { symbol: 'MSFT', name: 'Microsoft', price: 378.91, change: 4.67, changePercent: 1.25 },
    
    // Commodities
    { symbol: 'GOLD', name: 'Gold', price: 2035.40, change: 12.80, changePercent: 0.63 },
    { symbol: 'OIL', name: 'Crude Oil', price: 78.45, change: -1.23, changePercent: -1.54 },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => prev.map(ticker => {
        const volatility = ticker.symbol.includes('BTC') || ticker.symbol.includes('ETH') ? 50 : 
                          ticker.symbol.includes('/') && !ticker.symbol.includes('USD') ? 0.0005 : 
                          ticker.symbol === 'GOLD' ? 2 : 
                          ticker.symbol === 'OIL' ? 0.5 : 1;
        
        const randomChange = (Math.random() - 0.5) * volatility;
        const newPrice = Math.max(0, ticker.price + randomChange);
        const newChange = ticker.change + randomChange;
        const newChangePercent = (newChange / (newPrice - newChange)) * 100;

        return {
          ...ticker,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
        };
      }));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#0F0810] via-[#1A0E15] to-[#0F0810] border-b border-[#C75B7A]/20 shadow-lg overflow-hidden">
      <div className="relative">
        {/* Gradient Overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0F0810] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0F0810] to-transparent z-10 pointer-events-none" />

        <div 
          ref={containerRef}
          className="flex gap-8 py-3 px-4 animate-scroll-left"
        >
          {/* Duplicate items for seamless loop */}
          {[...tickers, ...tickers].map((ticker, index) => {
            const isPositive = ticker.change >= 0;
            const Icon = isPositive ? TrendingUp : TrendingDown;

            return (
              <div
                key={`${ticker.symbol}-${index}`}
                className="flex items-center gap-3 min-w-fit px-4 py-1 rounded-lg bg-[#1A0E15]/50 border border-[#C75B7A]/10 hover:border-[#F9D949]/30 transition-all group"
              >
                {/* Symbol */}
                <div className="flex flex-col">
                  <span className="text-[#FFF8E7] font-bold text-sm whitespace-nowrap">{ticker.symbol}</span>
                  <span className="text-[#FFF8E7]/40 text-xs whitespace-nowrap">{ticker.name}</span>
                </div>

                {/* Price and Change */}
                <div className="flex items-center gap-2">
                  <span className="text-[#FFF8E7] font-semibold text-base animate-fade-in">
                    ${ticker.price.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: ticker.price < 1 ? 4 : 2 
                    })}
                  </span>

                  {/* Change */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded animate-pulse-slow ${
                    isPositive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Icon className="w-3 h-3 animate-pulse" />
                    <span className="text-xs font-semibold animate-counter">
                      {isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
