# Phase 4 - Animation Engine

## Overview
GPU-accelerated animation system with 120hz smooth performance for BagBot v5.1 frontend.

## Implemented Features

### 1. Core Animation CSS (`styles/animations.css`)
- **GPU Acceleration**: `will-change`, `transform: translateZ(0)`, `backface-visibility: hidden`
- **Smooth Transitions**: 120hz optimized cubic-bezier timing functions
- **Performance**: Automatic reduced motion support for accessibility

### 2. Glow Pulse Animations
- `pulse-glow-cyan`: Cyan border/shadow pulse (2s infinite)
- `pulse-glow-magenta`: Magenta border/shadow pulse (2s infinite)
- `pulse-glow-green`: Green border/shadow pulse (2s infinite)
- **Usage**: 4-layer box-shadow with intensity variation (0.4 → 0.6)

### 3. Text Breathing Effects
- `breathe-text-cyan`: Cyan text-shadow breathing (3s infinite)
- `breathe-text-magenta`: Magenta text-shadow breathing (3s infinite)
- **Usage**: 4-layer text-shadow with intensity scaling (0.8 → 1.0)

### 4. Holographic Shimmer
- `hologram-shimmer`: Gradient background animation (3s infinite)
- **Effect**: Linear gradient moving from cyan → magenta → cyan
- **Usage**: Background overlays, panel effects

### 5. Spark Animations
- `spark-flash`: Quick flash effect (0.6s)
- `spark-trail`: Trailing motion effect (1s)
- **Usage**: Data updates, trade signals, notifications

### 6. Data Update Animations
- `data-update-pulse`: Scale + background pulse (0.4s)
- **Usage**: Real-time price updates, balance changes

### 7. Parallax System
- 3 depth layers: `parallax-layer-1/2/3`
- Scroll-based depth effects with `translateZ`
- **Component**: `ParallaxContainer.tsx` with scroll listener

### 8. Hover Micro-Interactions
- `hover-lift`: translateY(-4px) on hover
- `hover-scale`: scale(1.05) on hover
- `hover-glow`: Enhanced box-shadow on hover
- **Timing**: 0.2-0.3s cubic-bezier transitions

### 9. Click Feedback
- `click-feedback`: Ripple effect on click
- **Animation**: Radial scale expansion with opacity fade
- **Duration**: 0.6s cubic-bezier

### 10. Loading Animations
- `spin-glow`: 360deg rotation (2s linear infinite)
- `pulse-scale`: Scale pulse with opacity (1.5s infinite)
- **Usage**: Loading spinners, activity indicators

### 11. Fade Animations
- `fade-in`: Opacity 0 → 1 (0.4s)
- `fade-in-up`: Fade + translateY(20px → 0) (0.5s)
- `fade-in-down`: Fade + translateY(-20px → 0) (0.5s)

### 12. Slide Animations
- `slide-in-left`: translateX(-100% → 0) + fade (0.4s)
- `slide-in-right`: translateX(100% → 0) + fade (0.4s)

## React Components

### `ParallaxContainer.tsx`
Scroll-based parallax depth system.
```tsx
<ParallaxContainer intensity={0.5}>
  <div data-parallax="0.5">Layer 1</div>
  <div data-parallax="1.0">Layer 2</div>
</ParallaxContainer>
```

### `AnimatedCard.tsx`
Card with glow pulse and hover effects.
```tsx
<AnimatedCard variant="pulse-cyan" hover={true} delay={200}>
  Content
</AnimatedCard>
```
**Variants**: `pulse-cyan`, `pulse-magenta`, `pulse-green`, `shimmer`

### `AnimatedText.tsx`
Text with breathing glow effects.
```tsx
<AnimatedText variant="breathe-cyan" delay={500}>
  Neon Text
</AnimatedText>
```
**Variants**: `breathe-cyan`, `breathe-magenta`, `glow-cyan`, `glow-magenta`

### `DataSpark.tsx`
Real-time data update spark effect.
```tsx
<DataSpark 
  value={price} 
  previousValue={prevPrice}
  sparkColor="green"
/>
```
**Auto-triggers**: Spark animation when `value` changes

### `HoverButton.tsx`
Interactive button with lift/glow/ripple effects.
```tsx
<HoverButton 
  variant="cyan" 
  size="md"
  onClick={handleClick}
>
  Action
</HoverButton>
```
**Features**: Click ripple, hover lift, glow pulse

### `GlowingPanel.tsx`
Panel with animated border glow.
```tsx
<GlowingPanel 
  glowColor="magenta" 
  intensity="high"
  animate={true}
>
  Content
</GlowingPanel>
```

### `LoadingSpinner.tsx`
Spinning glow loader.
```tsx
<LoadingSpinner size="lg" color="cyan" />
```

### `PageTransition.tsx`
Page entry animations.
```tsx
<PageTransition direction="up">
  <YourPage />
</PageTransition>
```
**Directions**: `up`, `down`, `left`, `right`

### `TradeSignalSpark.tsx`
Trade signal visual feedback.
```tsx
<TradeSignalSpark 
  type="buy" 
  amount={1250.50}
/>
```
**Types**: `buy` (green ↑), `sell` (magenta ↓), `neutral` (cyan →)

## Performance Optimizations

1. **GPU Acceleration**: All animations use `transform` and `opacity` (GPU-accelerated properties)
2. **Will-change**: Applied to animated elements for layer promotion
3. **Reduced Motion**: Automatic detection via `@media (prefers-reduced-motion: reduce)`
4. **Passive Listeners**: Scroll events use `{ passive: true }`
5. **120hz Optimized**: Cubic-bezier timing functions for high refresh rate displays

## CSS Class Utilities

### Transitions
- `.transition-smooth` - 0.3s all properties
- `.transition-fast` - 0.15s all properties
- `.transition-slow` - 0.5s all properties
- `.transition-transform` - 0.3s transform only
- `.transition-opacity` - 0.3s opacity only

### GPU Acceleration
- `.gpu-accelerated` - Force GPU layer promotion

### Hover Effects
- `.hover-lift` - Lift on hover (-4px)
- `.hover-scale` - Scale on hover (1.05)
- `.hover-glow` - Enhanced glow on hover

### Click Effects
- `.click-feedback` - Ripple effect on click

### Animation Classes
- `.pulse-glow-cyan/magenta/green` - Glow pulse
- `.breathe-text-cyan/magenta` - Text breathing
- `.hologram-shimmer` - Shimmer effect
- `.spark-flash` - Quick flash
- `.spark-trail` - Trail effect
- `.data-update` - Data pulse
- `.spin-glow` - Rotation
- `.pulse-scale` - Scale pulse
- `.fade-in/up/down` - Fade animations
- `.slide-in-left/right` - Slide animations

## Integration with Existing Components

All animation classes can be applied to existing components:
- `HoloButton` → Add `hover-lift`, `click-feedback`
- `HoloCard` → Add `pulse-glow-cyan`, `fade-in-up`
- Stats widgets → Wrap with `AnimatedCard`
- Price displays → Use `DataSpark`
- Page layouts → Wrap with `PageTransition`

## Next Steps (Phase 5)

1. Apply animations to all 11 pages
2. Integrate `DataSpark` with real-time data
3. Add `ParallaxContainer` to dashboard
4. Optimize bundle size (tree-shake unused animations)
5. Final polish and glow refinement
