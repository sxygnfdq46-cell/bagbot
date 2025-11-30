# LEVEL 6.1 BIC — INTEGRATION EXAMPLE

## ✅ Core Files Complete

1. **BehaviorCore.ts** — Emotional state engine (350+ lines)
2. **behaviorMap.ts** — Data-to-reaction mapper (200+ lines)  
3. **BehaviorProvider.tsx** — Global context with 60fps loop (150+ lines)
4. **layout.tsx** — BehaviorProvider wrapper applied ✅

---

## 📖 How to Use BIC in Any Page

### Step 1: Import the Hook

```typescript
import { useBehavior } from '@/app/engine/bic/BehaviorProvider';
```

### Step 2: Call useBehavior() in Component

```typescript
export default function MyPage() {
  const { behavior, isActive } = useBehavior();
  
  // Destructure the emotional state + UI drivers
  const {
    emotionalState,       // 'calm' | 'focused' | 'alert' | 'stressed' | 'overclocked'
    auraIntensity,        // 0-100
    hudGlowStrength,      // 20-100
    backgroundPulseSpeed, // 10-100
    dataRippleFrequency,  // 5-100
    colorTemperature,     // -180 to 180 (hue shift)
    intensity,            // 5-100 (master intensity)
    systemWarnings,       // string[] (up to 5 warnings)
    marketMood            // Human-readable string
  } = behavior;
  
  // ...
}
```

### Step 3: Pass to Visual Components

#### Level 4 Quantum Components

```typescript
// Particles react to intensity
<ParticleUniverse enabled={true} intensity={intensity} />

// Camera drift speed from pulse
<CameraDrift speed={backgroundPulseSpeed / 50} />

// Quantum field ripples from frequency
<QuantumField rippleFrequency={dataRippleFrequency} />

// Hologram refraction from emotional state
<HoloRefract distortion={emotionalState === 'overclocked' ? 0.8 : 0.2} />
```

#### Level 5 Ascension Components

```typescript
// AI Aura with intensity
<AIEmotionAura 
  emotion={emotionalState} 
  intensity={auraIntensity} 
/>

// HaloFlux matches state
<HaloFlux 
  intensity={emotionalState === 'stressed' ? 'intense' : 'active'} 
/>

// Aurora background with color temperature
<AuroraBackground 
  colorShift={colorTemperature} 
/>

// HUD scaling from glow strength
<AdaptiveHUD 
  scale={hudGlowStrength / 100} 
/>
```

#### CSS Variables (Dynamic Styling)

```typescript
<div
  style={{
    '--aura-intensity': auraIntensity,
    '--pulse-speed': `${backgroundPulseSpeed / 100}s`,
    '--ripple-freq': dataRippleFrequency,
    '--color-temp': `${colorTemperature}deg`,
    '--master-intensity': intensity / 100,
  } as React.CSSProperties}
  className="bic-driven-container"
>
  {/* Your content here */}
</div>
```

---

## 🎨 Complete Integration Example

```typescript
'use client';

import { useBehavior } from '@/app/engine/bic/BehaviorProvider';
import { ParticleUniverse, CameraDrift } from '@/components/quantum/QuantumEffects';
import { HaloFlux, AuroraBackground, AIEmotionAura } from '@/components/ascension/AscensionEffects';
import { SciFiShell } from './sci-fi-shell';

export default function MyPage() {
  const { behavior, isActive } = useBehavior();
  const {
    emotionalState,
    auraIntensity,
    hudGlowStrength,
    backgroundPulseSpeed,
    dataRippleFrequency,
    colorTemperature,
    intensity,
    systemWarnings,
    marketMood
  } = behavior;

  // Convert emotional state to HaloFlux intensity
  const haloIntensity = 
    emotionalState === 'overclocked' ? 'intense' :
    emotionalState === 'stressed' ? 'intense' :
    emotionalState === 'alert' ? 'active' : 'idle';

  return (
    <SciFiShell>
      {/* Level 6.1 BIC Powers Everything Below */}
      
      {/* Level 5 Ascension */}
      <HaloFlux intensity={haloIntensity} />
      <AuroraBackground colorShift={colorTemperature} />
      <AIEmotionAura emotion={emotionalState} intensity={auraIntensity} />
      
      {/* Level 4 Quantum */}
      <ParticleUniverse enabled={true} intensity={intensity} />
      <CameraDrift speed={backgroundPulseSpeed / 50} />
      
      {/* Your UI Content */}
      <div 
        className="page-content"
        style={{
          '--pulse-speed': `${backgroundPulseSpeed / 100}s`,
          '--ripple-freq': dataRippleFrequency,
        } as React.CSSProperties}
      >
        {/* System Status Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold neon-text">
            {emotionalState.toUpperCase()} MODE
          </h1>
          <div className="text-sm opacity-70">
            {marketMood}
          </div>
        </div>

        {/* Warnings Display */}
        {systemWarnings.length > 0 && (
          <div className="warning-panel mb-6 p-4 rounded border border-yellow-500/30 bg-yellow-900/10">
            {systemWarnings.map((warning, idx) => (
              <div key={idx} className="text-yellow-400 text-sm mb-1">
                ⚠ {warning}
              </div>
            ))}
          </div>
        )}

        {/* Rest of your page content */}
        {/* ... */}
      </div>
    </SciFiShell>
  );
}
```

---

## 🔥 Real-Time Behavior Examples

### Example 1: Calm Market (Low Volatility)
- **Emotional State**: `'calm'`
- **Aura Intensity**: 50-60
- **Pulse Speed**: 30-40
- **Color Temperature**: 0 (neutral blue)
- **Visual Result**: Slow drifting particles, minimal ripples, cool blue tones

### Example 2: Active Trading (Medium Activity)
- **Emotional State**: `'focused'`
- **Aura Intensity**: 65-75
- **Pulse Speed**: 50-60
- **Color Temperature**: +20 (slight green shift from profits)
- **Visual Result**: Cyan pulses, moderate particle movement, balanced intensity

### Example 3: High Volatility Spike
- **Emotional State**: `'alert'`
- **Aura Intensity**: 80-85
- **Pulse Speed**: 70-80
- **Ripple Frequency**: 60+
- **Color Temperature**: -30 (magenta shift from losses)
- **Visual Result**: Yellow aura, rapid ripples, distortion effects, fast particle streams

### Example 4: System Under Load
- **Emotional State**: `'stressed'`
- **Aura Intensity**: 90+
- **HUD Glow**: Dimmed (high CPU pressure)
- **Pulse Speed**: 85+
- **Visual Result**: Magenta halo, dimmed holograms, warning ripples, system pressure indicators

### Example 5: Extreme Market Conditions
- **Emotional State**: `'overclocked'`
- **Aura Intensity**: 100
- **Pulse Speed**: 100
- **Ripple Frequency**: 100
- **Color Temperature**: +180 or -180 (extreme hue shift)
- **Visual Result**: Red pulses at max speed, heavy distortion, maximum particle activity, full neon saturation

---

## 📊 Behavior Data Sources

BehaviorProvider ingests 6 backend streams at different intervals:

1. **Market Summary** (5s) → Overall market conditions
2. **Price Data** (2s) → Real-time price changes  
3. **Volatility Metrics** (3s) → Vol ratios and spikes
4. **Strategy Performance** (5s) → P&L, win rate, execution times
5. **System Health** (5s) → CPU, memory, errors, uptime
6. **Liquidity Metrics** (5s) → Spread percentages

Plus 2 WebSocket channels for instant reactions:

7. **Live Prices** → Immediate intensity spikes on price changes
8. **Live Signals** → Warning triggers for high-confidence signals

All data flows through `BehaviorCore.ingest()` at 60fps, calculating emotional state and 6 UI driver values in real-time.

---

## ✅ Safety Compliance

- **100% READ-ONLY** — BIC only reads data, never writes
- **No Commands** — Zero strategy edits, no execution triggers
- **Pure Calculations** — All methods are pure functions
- **FULLSTACK SAFE MODE** — Maintains separation between UI intelligence and backend operations

BIC is the "nervous system" that observes and reacts, not the "brain" that decides and executes.

---

## 🚀 Next Steps

1. Update all 11 pages to use `useBehavior()` hook
2. Pass behavior values to existing Level 4/5 components
3. Add CSS variables for dynamic styling
4. Test emotional state transitions
5. Fine-tune thresholds in BehaviorCore/behaviorMap

**BIC Status**: 80% COMPLETE ⏳  
- ✅ BehaviorCore.ts (emotional engine)
- ✅ behaviorMap.ts (reaction mapper)
- ✅ BehaviorProvider.tsx (60fps context)
- ✅ layout.tsx (global wrapper)
- ⏳ Page integrations (pending)
- ⏳ Component prop updates (pending)
