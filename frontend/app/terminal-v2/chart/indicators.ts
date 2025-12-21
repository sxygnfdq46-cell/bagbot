import type { Bar } from "./ChartPane";

export type SeriesPoint = { time: number; value: number };
export type DualSeriesPoint = { time: number; valueA: number; valueB: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const emptyNumberArray = (len: number) => Array.from({ length: len }, () => NaN);
const ensureBars = (bars: Bar[] | undefined | null) => Array.isArray(bars) ? bars : [];

function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  let sum = 0;
  values.forEach((v, i) => {
    sum += v;
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i + 1 >= period) {
      out.push(sum / period);
    } else {
      out.push(NaN);
    }
  });
  return out;
}

function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  values.forEach((v, i) => {
    if (i === 0 || prev === null) {
      prev = v;
    } else {
      prev = v * k + prev * (1 - k);
    }
    out.push(prev);
  });
  return out;
}

function wma(values: number[], period: number): number[] {
  const out: number[] = [];
  const denom = (period * (period + 1)) / 2;
  values.forEach((_, i) => {
    if (i + 1 < period) {
      out.push(NaN);
      return;
    }
    let sum = 0;
    for (let p = 0; p < period; p += 1) {
      sum += values[i - p] * (period - p);
    }
    out.push(sum / denom);
  });
  return out;
}

function hma(values: number[], period: number): number[] {
  const half = Math.max(1, Math.floor(period / 2));
  const sqrt = Math.max(1, Math.floor(Math.sqrt(period)));
  const wmaHalf = wma(values, half);
  const wmaFull = wma(values, period);
  const diff = wmaHalf.map((v, i) => 2 * v - (wmaFull[i] ?? v));
  return wma(diff, sqrt);
}

function highest(values: number[], period: number, idx: number) {
  let max = -Infinity;
  for (let i = idx - period + 1; i <= idx; i += 1) {
    max = Math.max(max, values[i]);
  }
  return max;
}

function lowest(values: number[], period: number, idx: number) {
  let min = Infinity;
  for (let i = idx - period + 1; i <= idx; i += 1) {
    min = Math.min(min, values[i]);
  }
  return min;
}

export function computeTrendIndicators(bars: Bar[]) {
  const safeBars = ensureBars(bars);
  if (safeBars.length === 0) {
    return {
      sma20: [],
      sma50: [],
      ema20: [],
      ema50: [],
      wma21: [],
      hma21: [],
      vwap: [],
      ichimoku: { tenkan: [], kijun: [], senkouA: [], senkouB: [], chikou: [] },
    };
  }

  const closes = safeBars.map((b) => b.close);
  const highs = safeBars.map((b) => b.high);
  const lows = safeBars.map((b) => b.low);
  const volumes = safeBars.map((b) => b.volume);

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const wma21 = wma(closes, 21);
  const hma21 = hma(closes, 21);

  // VWAP resets each session (midnight local)
  const vwap: number[] = [];
  let pvSum = 0;
  let volSum = 0;
  let currentDay: string | null = null;
  safeBars.forEach((bar, i) => {
    const dayKey = new Date(bar.time).toDateString();
    if (dayKey !== currentDay) {
      pvSum = 0;
      volSum = 0;
      currentDay = dayKey;
    }
    const typical = (bar.high + bar.low + bar.close) / 3;
    pvSum += typical * bar.volume;
    volSum += bar.volume;
    vwap.push(volSum === 0 ? bar.close : pvSum / volSum);
  });

  // Ichimoku 9/26/52
  const tenkan: number[] = [];
  const kijun: number[] = [];
  const senkouA: number[] = [];
  const senkouB: number[] = [];
  const chikou: number[] = [];

  safeBars.forEach((_, i) => {
    if (i < 8) {
      tenkan.push(NaN);
    } else {
      tenkan.push((highest(highs, 9, i) + lowest(lows, 9, i)) / 2);
    }
    if (i < 25) {
      kijun.push(NaN);
    } else {
      kijun.push((highest(highs, 26, i) + lowest(lows, 26, i)) / 2);
    }
    if (i < 51) {
      senkouB.push((highest(highs, 52, i) + lowest(lows, 52, i)) / 2);
    } else {
      senkouB.push((highest(highs, 52, i) + lowest(lows, 52, i)) / 2);
    }
    chikou.push(safeBars[i]?.close ?? NaN);
  });

  // shift senkou ahead 26 periods
  for (let i = 0; i < safeBars.length; i += 1) {
    const a = (tenkan[i] + kijun[i]) / 2;
    senkouA[i + 26] = a;
    if (senkouB[i] !== undefined) {
      senkouB[i + 26] = senkouB[i];
    }
  }

  return {
    sma20,
    sma50,
    ema20,
    ema50,
    wma21,
    hma21,
    vwap,
    ichimoku: { tenkan, kijun, senkouA, senkouB, chikou },
  };
}

export function computeVolatilityIndicators(bars: Bar[]) {
  const safeBars = ensureBars(bars);
  if (safeBars.length === 0) {
    return {
      bollinger: { mid: [], upper: [], lower: [] },
      keltner: { mid: [], upper: [], lower: [] },
      donchian: { upper: [], lower: [] },
      atr: [],
      stdDev20: [],
    };
  }

  const closes = safeBars.map((b) => b.close);
  const highs = safeBars.map((b) => b.high);
  const lows = safeBars.map((b) => b.low);

  const bbPeriod = 20;
  const bbStd = 2;
  const bbMid = sma(closes, bbPeriod);
  const std: number[] = [];
  closes.forEach((_, i) => {
    if (i + 1 < bbPeriod) {
      std.push(NaN);
      return;
    }
    const slice = closes.slice(i - bbPeriod + 1, i + 1);
    const mean = slice.reduce((acc, v) => acc + v, 0) / slice.length;
    const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / slice.length;
    std.push(Math.sqrt(variance));
  });
  const bbUpper = bbMid.map((m, i) => m + (std[i] ?? 0) * bbStd);
  const bbLower = bbMid.map((m, i) => m - (std[i] ?? 0) * bbStd);

  const tr: number[] = [];
  safeBars.forEach((bar, i) => {
    if (i === 0) {
      tr.push(bar.high - bar.low);
      return;
    }
    const prevClose = safeBars[i - 1]?.close ?? bar.close;
    const highLow = bar.high - bar.low;
    const highClose = Math.abs(bar.high - prevClose);
    const lowClose = Math.abs(bar.low - prevClose);
    tr.push(Math.max(highLow, highClose, lowClose));
  });
  const atr = ema(tr, 14);

  const keltnerMid = ema(closes, 20);
  const keltnerUpper = keltnerMid.map((m, i) => m + (atr[i] ?? 0) * 1.5);
  const keltnerLower = keltnerMid.map((m, i) => m - (atr[i] ?? 0) * 1.5);

  const donchianPeriod = 20;
  const donchianUpper: number[] = [];
  const donchianLower: number[] = [];
  safeBars.forEach((_, i) => {
    if (i + 1 < donchianPeriod) {
      donchianUpper.push(NaN);
      donchianLower.push(NaN);
      return;
    }
    donchianUpper.push(highest(highs, donchianPeriod, i));
    donchianLower.push(lowest(lows, donchianPeriod, i));
  });

  const stdDev20 = std;

  return {
    bollinger: { mid: bbMid, upper: bbUpper, lower: bbLower },
    keltner: { mid: keltnerMid, upper: keltnerUpper, lower: keltnerLower },
    donchian: { upper: donchianUpper, lower: donchianLower },
    atr,
    stdDev20,
  };
}

export function computeMomentumIndicators(bars: Bar[]) {
  const safeBars = ensureBars(bars);
  if (safeBars.length === 0) {
    return {
      rsi: [],
      stoch: { k: [], d: [] },
      macd: { line: [], signal: [], histogram: [] },
      cci: [],
      roc: [],
      williamsR: [],
    };
  }

  const closes = safeBars.map((b) => b.close);
  const highs = safeBars.map((b) => b.high);
  const lows = safeBars.map((b) => b.low);

  const rsiPeriod = 14;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 0; i < closes.length; i += 1) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
    } else {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
  }
  const avgGain = ema(gains, rsiPeriod);
  const avgLoss = ema(losses, rsiPeriod);
  const rsi = avgGain.map((g, i) => {
    const l = avgLoss[i] ?? 0;
    if (l === 0) return 100;
    const rs = g / l;
    return 100 - 100 / (1 + rs);
  });

  const stochK: number[] = [];
  const stochD: number[] = [];
  const stochPeriod = 14;
  const stochSmooth = 3;
  safeBars.forEach((_, i) => {
    if (i + 1 < stochPeriod) {
      stochK.push(NaN);
      return;
    }
    const highestHigh = highest(highs, stochPeriod, i);
    const lowestLow = lowest(lows, stochPeriod, i);
    const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow || 1)) * 100;
    stochK.push(k);
  });
  const stochKSmooth = sma(stochK.map((v) => (Number.isFinite(v) ? v : NaN)), stochSmooth);
  stochKSmooth.forEach((v) => stochD.push(v));

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - (ema26[i] ?? v));
  const signal = ema(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - (signal[i] ?? v));

  const cciPeriod = 20;
  const typicalPrices = safeBars.map((b) => (b.high + b.low + b.close) / 3);
  const cciSma = sma(typicalPrices, cciPeriod);
  const cci: number[] = [];
  typicalPrices.forEach((tp, i) => {
    if (i + 1 < cciPeriod) {
      cci.push(NaN);
      return;
    }
    const mean = cciSma[i];
    const slice = typicalPrices.slice(i - cciPeriod + 1, i + 1);
    const meanDev = slice.reduce((acc, v) => acc + Math.abs(v - mean), 0) / cciPeriod;
    cci.push(((tp - mean) / (0.015 * (meanDev || 1))));
  });

  const rocPeriod = 9;
  const roc: number[] = closes.map((v, i) => (i >= rocPeriod ? ((v - closes[i - rocPeriod]) / (closes[i - rocPeriod] || 1)) * 100 : NaN));

  const williamsPeriod = 14;
  const williamsR: number[] = [];
  safeBars.forEach((_, i) => {
    if (i + 1 < williamsPeriod) {
      williamsR.push(NaN);
      return;
    }
    const hh = highest(highs, williamsPeriod, i);
    const ll = lowest(lows, williamsPeriod, i);
    williamsR.push(-((hh - closes[i]) / (hh - ll || 1)) * 100);
  });

  return {
    rsi,
    stoch: { k: stochK, d: stochD },
    macd: { line: macdLine, signal, histogram },
    cci,
    roc,
    williamsR,
  };
}

export function computeVolumeIndicators(bars: Bar[]) {
  const safeBars = ensureBars(bars);
  if (safeBars.length === 0) {
    return { volSma: [], obv: [], accDist: [], mfi: [], volumeOsc: [] };
  }

  const closes = safeBars.map((b) => b.close);
  const volumes = safeBars.map((b) => b.volume);

  const volSma = sma(volumes, 20);

  const obv: number[] = [];
  safeBars.forEach((bar, i) => {
    if (i === 0) {
      obv.push(bar.volume);
    } else {
      const prev = safeBars[i - 1];
      const delta = prev ? (bar.close > prev.close ? bar.volume : bar.close < prev.close ? -bar.volume : 0) : 0;
      obv.push(obv[i - 1] + delta);
    }
  });

  const accDist: number[] = [];
  safeBars.forEach((bar, i) => {
    const clv = ((bar.close - bar.low) - (bar.high - bar.close)) / (bar.high - bar.low || 1);
    const moneyFlow = clv * bar.volume;
    accDist.push((accDist[i - 1] || 0) + moneyFlow);
  });

  const mfiPeriod = 14;
  const mfi: number[] = [];
  const typicalPrices = safeBars.map((b) => (b.high + b.low + b.close) / 3);
  const moneyFlows = typicalPrices.map((tp, i) => tp * safeBars[i].volume);
  for (let i = 0; i < safeBars.length; i += 1) {
    if (i + 1 < mfiPeriod) {
      mfi.push(NaN);
      continue;
    }
    let pos = 0;
    let neg = 0;
    for (let j = i - mfiPeriod + 1; j <= i; j += 1) {
      const prev = typicalPrices[Math.max(0, j - 1)];
      if (typicalPrices[j] >= prev) {
        pos += moneyFlows[j];
      } else {
        neg += moneyFlows[j];
      }
    }
    const ratio = neg === 0 ? 100 : pos / neg;
    mfi.push(100 - 100 / (1 + ratio));
  }

  const volOscFast = ema(volumes, 14);
  const volOscSlow = ema(volumes, 28);
  const volumeOsc = volOscFast.map((v, i) => ((v - (volOscSlow[i] ?? v)) / ((volOscSlow[i] ?? v) || 1)) * 100);

  return { volSma, obv, accDist, mfi, volumeOsc };
}

export function computeMarketStructureTools(bars: Bar[]) {
  const safeBars = ensureBars(bars);
  if (safeBars.length === 0) {
    const emptyRange = { high: 0, low: 0 };
    const emptyPivots = { pp: 0, r1: 0, s1: 0, r2: 0, s2: 0, r3: 0, s3: 0 };
    return {
      classic: emptyPivots,
      floor: emptyPivots,
      session: emptyPivots,
      sessionHighLow: emptyRange,
      dailyHighLow: emptyRange,
      weeklyBands: emptyRange,
      openingRange: { high: 0, low: 0, start: 0, end: 0 },
    };
  }

  const highs = safeBars.map((b) => b.high);
  const lows = safeBars.map((b) => b.low);
  const closes = safeBars.map((b) => b.close);
  const times = safeBars.map((b) => b.time);

  const groupedByDay: Record<string, { highs: number[]; lows: number[]; closes: number[]; times: number[] }> = {};
  safeBars.forEach((bar) => {
    const key = new Date(bar.time).toDateString();
    if (!groupedByDay[key]) groupedByDay[key] = { highs: [], lows: [], closes: [], times: [] };
    groupedByDay[key].highs.push(bar.high);
    groupedByDay[key].lows.push(bar.low);
    groupedByDay[key].closes.push(bar.close);
    groupedByDay[key].times.push(bar.time);
  });
  const dayKeys = Object.keys(groupedByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const prevDayKey = dayKeys[dayKeys.length - 2] ?? dayKeys[dayKeys.length - 1];
  const prevDay = groupedByDay[prevDayKey];
  const prevHigh = prevDay ? Math.max(...prevDay.highs) : 0;
  const prevLow = prevDay ? Math.min(...prevDay.lows) : 0;
  const prevClose = prevDay ? prevDay.closes[prevDay.closes.length - 1] : 0;

  const classicP = (prevHigh + prevLow + prevClose) / 3;
  const classic = {
    pp: classicP,
    r1: classicP * 2 - prevLow,
    s1: classicP * 2 - prevHigh,
    r2: classicP + (prevHigh - prevLow),
    s2: classicP - (prevHigh - prevLow),
    r3: prevHigh + 2 * (classicP - prevLow),
    s3: prevLow - 2 * (prevHigh - classicP),
  };

  const floor = classic;

  const sessionKey = dayKeys[dayKeys.length - 1];
  const session = groupedByDay[sessionKey];
  const sessionHigh = session ? Math.max(...session.highs) : 0;
  const sessionLow = session ? Math.min(...session.lows) : 0;
  const sessionClose = session ? session.closes[session.closes.length - 1] : 0;
  const sessionP = (sessionHigh + sessionLow + sessionClose) / 3;
  const sessionPivots = {
    pp: sessionP,
    r1: sessionP * 2 - sessionLow,
    s1: sessionP * 2 - sessionHigh,
    r2: sessionP + (sessionHigh - sessionLow),
    s2: sessionP - (sessionHigh - sessionLow),
  };

  const sessionHighLow = { high: sessionHigh, low: sessionLow };

  const dailyHighLow = { high: highs.length ? Math.max(...highs) : 0, low: lows.length ? Math.min(...lows) : 0 };
  const weeklyBands = (() => {
    const weeks: Record<string, { highs: number[]; lows: number[] }> = {};
    safeBars.forEach((bar) => {
      const d = new Date(bar.time);
      const weekKey = `${d.getFullYear()}-w${Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      if (!weeks[weekKey]) weeks[weekKey] = { highs: [], lows: [] };
      weeks[weekKey].highs.push(bar.high);
      weeks[weekKey].lows.push(bar.low);
    });
    const lastWeekKey = Object.keys(weeks).sort().pop();
    if (!lastWeekKey) return { high: 0, low: 0 };
    return { high: Math.max(...weeks[lastWeekKey].highs), low: Math.min(...weeks[lastWeekKey].lows) };
  })();

  const openingRangeBars = 30;
  const openHighSlice = highs.slice(0, openingRangeBars);
  const openLowSlice = lows.slice(0, openingRangeBars);
  const openRangeHigh = openHighSlice.length > 0 ? Math.max(...openHighSlice) : safeBars[0].high;
  const openRangeLow = openLowSlice.length > 0 ? Math.min(...openLowSlice) : safeBars[0].low;

  return {
    classic,
    floor,
    session: sessionPivots,
    sessionHighLow,
    dailyHighLow,
    weeklyBands,
    openingRange: {
      high: openRangeHigh,
      low: openRangeLow,
      start: times[0] ?? 0,
      end: times[Math.min(openingRangeBars - 1, Math.max(times.length - 1, 0))] ?? 0,
    },
  };
}

export function computeFibonacci(bars: Bar[]) {
  const safeBars = ensureBars(bars);
  if (safeBars.length < 2) return { retracement: null, extension: null, fan: null };
  const highs = safeBars.map((b) => b.high);
  const lows = safeBars.map((b) => b.low);

  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const highIdx = highs.indexOf(maxHigh);
  const lowIdx = lows.indexOf(minLow);
  if (highIdx === -1 || lowIdx === -1) return { retracement: null, extension: null, fan: null };
  const startIdx = lowIdx < highIdx ? lowIdx : highIdx;
  const endIdx = lowIdx < highIdx ? highIdx : lowIdx;
  const start = safeBars[startIdx];
  const end = safeBars[endIdx];
  if (!start || !end) return { retracement: null, extension: null, fan: null };

  const baseRange = end.close - start.close;
  const retraceLevels = [0, 23.6, 38.2, 50, 61.8, 78.6, 100];
  const retracement = {
    start,
    end,
    levels: retraceLevels.map((level) => ({ level, price: start.close + (baseRange * level) / 100 })),
  };

  // extensions based on last swing -> pullback -> continuation using last three pivots
  const pivots: { idx: number; type: "high" | "low"; price: number }[] = [];
  for (let i = 2; i < safeBars.length - 2; i += 1) {
    const prev = safeBars[i - 1];
    const curr = safeBars[i];
    const next = safeBars[i + 1];
    if (!prev || !curr || !next) continue;
    if (curr.high > prev.high && curr.high > next.high) {
      pivots.push({ idx: i, type: "high", price: curr.high });
    }
    if (curr.low < prev.low && curr.low < next.low) {
      pivots.push({ idx: i, type: "low", price: curr.low });
    }
  }
  const recent = pivots.slice(-3);
  let extStart = start;
  let extMid = start;
  let extEnd = end;
  if (recent.length === 3) {
    extStart = safeBars[recent[0].idx] ?? extStart;
    extMid = safeBars[recent[1].idx] ?? extMid;
    extEnd = safeBars[recent[2].idx] ?? extEnd;
  }
  const extRange = extMid.close - extStart.close;
  const extensionLevels = [127.2, 161.8, 261.8];
  const extension = {
    start: extStart,
    mid: extMid,
    end: extEnd,
    levels: extensionLevels.map((level) => ({ level, price: extEnd.close + (extRange * (level - 100)) / 100 })),
  };

  const fan = {
    start,
    end,
    lines: [23.6, 38.2, 50, 61.8].map((level) => ({ level, priceAtEnd: start.close + (baseRange * level) / 100 })),
  };

  return { retracement, extension, fan };
}

export function computeIndicators(bars: Bar[]) {
  const safeBars = ensureBars(bars);
  if (safeBars.length === 0) {
    return {
      trend: computeTrendIndicators(safeBars),
      volatility: computeVolatilityIndicators(safeBars),
      momentum: computeMomentumIndicators(safeBars),
      volume: computeVolumeIndicators(safeBars),
      structure: computeMarketStructureTools(safeBars),
      fibonacci: computeFibonacci(safeBars),
    };
  }
  return {
    trend: computeTrendIndicators(safeBars),
    volatility: computeVolatilityIndicators(safeBars),
    momentum: computeMomentumIndicators(safeBars),
    volume: computeVolumeIndicators(safeBars),
    structure: computeMarketStructureTools(safeBars),
    fibonacci: computeFibonacci(safeBars),
  };
}
