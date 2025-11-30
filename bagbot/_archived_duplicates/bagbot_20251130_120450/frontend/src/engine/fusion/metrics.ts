// /src/engine/fusion/metrics.ts
// Technical analysis score calculators

import { TechnicalSnapshot } from './FusionTypes';

export function calculateVolatilityScore(tech: TechnicalSnapshot): number {
  // Higher RSI extremes = higher volatility
  const rsiVolatility = Math.abs(tech.rsi - 50) / 50; // 0-1
  
  // Momentum extremes
  const momentumVolatility = Math.abs(tech.momentum) / 100; // 0-1
  
  // Combine
  const vol = (rsiVolatility + momentumVolatility) / 2;
  return vol * 100; // 0-100
}

export function calculateStrengthScore(tech: TechnicalSnapshot): number {
  // RSI component (30-70 optimal range)
  let rsiScore = 50;
  if (tech.rsi >= 30 && tech.rsi <= 70) {
    rsiScore = 70 + (tech.rsi - 50) * 0.6;
  } else if (tech.rsi > 70) {
    rsiScore = 50 - (tech.rsi - 70); // overbought penalty
  } else {
    rsiScore = 50 - (30 - tech.rsi); // oversold penalty
  }

  // Momentum component
  const momentumScore = 50 + tech.momentum * 0.5; // scale to 0-100

  // MACD component (simplified)
  const macdScore = tech.macd > 0 ? 60 : 40;

  // Trend bonus
  const trendBonus = tech.trend === 'up' ? 10 : tech.trend === 'down' ? -10 : 0;

  // Combine
  let strength = rsiScore * 0.4 + momentumScore * 0.4 + macdScore * 0.2 + trendBonus;
  return Math.max(0, Math.min(100, strength));
}
