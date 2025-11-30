# 🎲 MARKET SIMULATION ENGINE — QUICK REFERENCE

## 🚀 Get Started

```typescript
import { getMarketSimulationEngine } from '@/app/lib/simulation/MarketSimulationEngine';

// Initialize
const engine = getMarketSimulationEngine();

// Start simulation
engine.start();

// Subscribe to data
const unsubscribe = engine.subscribe('candle', (data) => {
  console.log(data);
});

// Cleanup
unsubscribe();
engine.stop();
```

---

## 📊 Event Subscriptions

### Candles (OHLCV Data)
```typescript
engine.subscribe('candle', ({ candle, timeframe }) => {
  // candle: { open, high, low, close, volume, timestamp, timeframe }
  // timeframe: '1m' | '5m' | '15m'
});
```

### Sentiment
```typescript
engine.subscribe('sentiment', (sentiment) => {
  // { bullish, bearish, neutral, volumeTrend, priceAction, timestamp }
});
```

### Threats
```typescript
engine.subscribe('threats', (threats) => {
  // ThreatSignal[] - volatility, volume spikes, price gaps
});
```

### Divergence
```typescript
engine.subscribe('divergence', (signal) => {
  // { type, strength, indicator, confidence, timestamp }
});
```

### Execution Signals
```typescript
engine.subscribe('execution', (signal) => {
  // { action, confidence, entryPrice, stopLoss, takeProfit }
});
```

### Risk Metrics
```typescript
engine.subscribe('risk', (metrics) => {
  // { score, riskClass, volatility, drawdown, sharpe }
});
```

---

## 🎛️ Controls

```typescript
// Change trend
engine.setTrend('BULL');      // 'BULL' | 'BEAR' | 'RANGE'

// Adjust volatility
engine.setVolatility(0.03);   // 0.001 - 0.1 (0.1% - 10%)

// Inject events
engine.injectEvent('PUMP');   // 'FLASH_CRASH' | 'PUMP' | 'DUMP'

// Get state
const state = engine.getMarketState();
// { currentPrice, trend, volatility, volume24h, lastUpdate }

// Get candles
const candles = engine.getCandles('1m', 20);  // Last 20 1m candles

// Reset
engine.reset();
```

---

## 🔌 Integration Examples

### Dashboard
```typescript
useEffect(() => {
  const engine = getMarketSimulationEngine();
  engine.start();
  
  const unsub = engine.subscribe('candle', ({ candle, timeframe }) => {
    if (timeframe === '1m') {
      setCandles(prev => [...prev.slice(-99), candle]);
    }
  });
  
  return () => {
    unsub();
    engine.stop();
  };
}, []);
```

### Threat Detection
```typescript
const engine = getMarketSimulationEngine();
this.unsub = engine.subscribe('threats', (threats) => {
  this.simulatedThreats = threats;
});
```

### Risk Scoring
```typescript
const engine = getMarketSimulationEngine();
this.unsub = engine.subscribe('risk', (risk) => {
  this.simulatedRisk = risk;
});
```

---

## 📋 Data Structures

### Candle
```typescript
{
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: '1m' | '5m' | '15m';
}
```

### MarketSentiment
```typescript
{
  bullish: number;      // 0-1
  bearish: number;      // 0-1
  neutral: number;      // 0-1
  volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  priceAction: 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'VOLATILE';
  timestamp: number;
}
```

### ThreatSignal
```typescript
{
  severity: number;     // 0-1
  type: 'VOLATILITY' | 'LIQUIDITY' | 'PRICE_GAP' | 'VOLUME_SPIKE';
  source: string;
  recommendation: string;
  timestamp: number;
}
```

---

## 🧪 Testing Scenarios

### Bull Market
```typescript
engine.setTrend('BULL');
engine.setVolatility(0.02);  // Moderate volatility
```

### Bear Market Crash
```typescript
engine.setTrend('BEAR');
engine.setVolatility(0.08);  // High volatility
engine.injectEvent('FLASH_CRASH');
```

### Ranging Market
```typescript
engine.setTrend('RANGE');
engine.setVolatility(0.01);  // Low volatility
```

### Pump & Dump
```typescript
engine.injectEvent('PUMP');
setTimeout(() => engine.injectEvent('DUMP'), 5000);
```

---

## ⚡ Performance Tips

1. **Limit stored candles**: Keep last 100 per timeframe
2. **Unsubscribe properly**: Always cleanup in useEffect
3. **Use appropriate timeframe**: 1m for real-time, 15m for analysis
4. **Batch updates**: Process multiple candles together
5. **Error handling**: Wrap in try-catch for SSR compatibility

---

## 🔧 Common Patterns

### Auto-start on mount
```typescript
useEffect(() => {
  const engine = getMarketSimulationEngine();
  engine.start();
  return () => engine.stop();
}, []);
```

### Multiple subscriptions
```typescript
useEffect(() => {
  const engine = getMarketSimulationEngine();
  
  const unsubs = [
    engine.subscribe('candle', handleCandle),
    engine.subscribe('sentiment', handleSentiment),
    engine.subscribe('threats', handleThreats),
  ];
  
  return () => unsubs.forEach(fn => fn());
}, []);
```

### Conditional market data
```typescript
if (!marketData && typeof window !== 'undefined') {
  const engine = getMarketSimulationEngine();
  const state = engine.getMarketState();
  marketData = {
    currentPrice: state.currentPrice,
    // ... other fields
  };
}
```

---

## 📍 File Locations

- **Engine**: `/frontend/app/lib/simulation/MarketSimulationEngine.ts`
- **Dashboard**: `/frontend/app/dashboard/page.tsx`
- **Threats**: `/frontend/engines/threat/ThreatSyncOrchestrator.ts`
- **Divergence**: `/frontend/app/lib/analytics/DivergenceInsightBridge.ts`
- **Execution**: `/frontend/app/lib/execution/ExecutionPrecisionCore.ts`
- **Risk**: `/frontend/components/shield/brain/RiskScoringEngine.ts`

---

## 🎯 Linked Components

✅ Dashboard candles  
✅ Sentiment analyzer  
✅ ThreatSyncOrchestrator  
✅ DivergenceInsightBridge  
✅ ExecutionPrecisionCore  
✅ RiskScoringEngine  

---

**Last Updated**: 28 November 2025  
🎲 **All integrations complete** 🎲
