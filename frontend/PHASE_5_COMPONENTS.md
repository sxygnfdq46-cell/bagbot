# BAGBOT2 Phase 5: Neon Component Library Reference

## 📦 Component Inventory

### Core Components (12)

#### 1. **NeonCard** 
`@/components/neon/NeonCard`
```tsx
<NeonCard glow="cyan" pulse hover onClick={handler}>
  {children}
</NeonCard>
```
**Props**:
- `glow`: 'cyan' | 'magenta' | 'yellow' | 'green' | 'orange' | 'none'
- `pulse`: boolean
- `hover`: boolean
- `onClick`: function

**Use Cases**: Primary container, section cards, panels

---

#### 2. **NeonButton**
`@/components/neon/NeonButton`
```tsx
<NeonButton variant="primary" size="md" loading disabled>
  {children}
</NeonButton>
```
**Props**:
- `variant`: 'primary' | 'secondary' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean
- `type`: 'button' | 'submit'

**Use Cases**: Actions, form submissions, CTAs

---

#### 3. **ReactorCore**
`@/components/neon/ReactorCore`
```tsx
<ReactorCore size="lg" status="active" showRings />
```
**Props**:
- `size`: 'sm' | 'md' | 'lg'
- `status`: 'active' | 'idle' | 'warning' | 'error'
- `showRings`: boolean

**Use Cases**: System status, loading animations, visual indicators

---

#### 4. **AIOrb**
`@/components/neon/AIOrb`
```tsx
<AIOrb onOpen={handler} position="bottom-right" />
```
**Props**:
- `onOpen`: function
- `position`: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

**Use Cases**: AI assistant trigger, floating help button

---

#### 5. **DataStream**
`@/components/neon/DataStream`
```tsx
<DataStream items={items} maxItems={50} autoScroll />
```
**Props**:
- `items`: Array<{id, timestamp, type, message, value}>
- `maxItems`: number
- `autoScroll`: boolean
- `type`: 'buy' | 'sell' | 'info' | 'warning' | 'error'

**Use Cases**: Live signals, logs, activity feeds, trading streams

---

#### 6. **StatusIndicator**
`@/components/neon/StatusIndicator`
```tsx
<StatusIndicator status="online" label="Connected" size="md" showPulse />
```
**Props**:
- `status`: 'online' | 'offline' | 'warning' | 'loading'
- `label`: string
- `size`: 'sm' | 'md' | 'lg'
- `showPulse`: boolean

**Use Cases**: Connection status, service health, availability

---

#### 7. **NeonBadge**
`@/components/neon/NeonBadge`
```tsx
<NeonBadge variant="green" size="sm" pulse>
  ACTIVE
</NeonBadge>
```
**Props**:
- `variant`: 'cyan' | 'magenta' | 'green' | 'yellow' | 'red' | 'gray'
- `size`: 'sm' | 'md' | 'lg'
- `pulse`: boolean

**Use Cases**: Status tags, labels, counts, indicators

---

#### 8. **MetricCard**
`@/components/neon/MetricCard`
```tsx
<MetricCard
  title="Total P&L"
  value="$12,450"
  subtitle="All-time"
  trend="up"
  trendValue="+12.4%"
  icon={<Icon />}
  glow="green"
  loading={false}
/>
```
**Props**:
- `title`: string
- `value`: string | number
- `subtitle`: string
- `trend`: 'up' | 'down' | 'neutral'
- `trendValue`: string
- `icon`: ReactNode
- `glow`: 'cyan' | 'magenta' | 'green' | 'yellow' | 'red'
- `loading`: boolean

**Use Cases**: KPI cards, performance metrics, dashboards

---

#### 9. **AlertPanel**
`@/components/neon/AlertPanel`
```tsx
<AlertPanel
  title="Risk Alert"
  message="Drawdown limit approaching"
  type="warning"
  timestamp="10:30 AM"
  dismissible
  onDismiss={handler}
/>
```
**Props**:
- `title`: string
- `message`: string
- `type`: 'info' | 'warning' | 'error' | 'critical'
- `timestamp`: string
- `dismissible`: boolean
- `onDismiss`: function

**Use Cases**: Risk alerts, notifications, warnings, errors

---

#### 10. **Modal**
`@/components/neon/Modal`
```tsx
<Modal
  isOpen={open}
  onClose={handler}
  title="Configure Strategy"
  size="lg"
  glow="cyan"
  showCloseButton
  closeOnOverlayClick
>
  {content}
</Modal>
```
**Props**:
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `glow`: 'cyan' | 'magenta' | 'yellow' | 'green'
- `showCloseButton`: boolean
- `closeOnOverlayClick`: boolean

**Use Cases**: Forms, confirmations, detailed views, settings

---

#### 11. **NeonTabs**
`@/components/neon/NeonTabs`
```tsx
<NeonTabs
  tabs={[
    { id: 'tab1', label: 'Overview', icon: <Icon />, badge: '5' }
  ]}
  activeTab={active}
  onTabChange={setActive}
  glow="cyan"
/>
```
**Props**:
- `tabs`: Array<{id, label, icon, badge}>
- `activeTab`: string
- `onTabChange`: function
- `glow`: 'cyan' | 'magenta' | 'yellow' | 'green'

**Use Cases**: Section navigation, view switching, categorization

---

#### 12. **cn Utility**
`@/utils/cn`
```tsx
import { cn } from '@/utils/cn';

className={cn(
  'base-class',
  conditionalClass && 'conditional',
  'override-class'
)}
```

**Use Cases**: Conditional classes, Tailwind deduplication

---

## 🎨 Design Tokens

### Glow Colors
```typescript
type GlowColor = 'cyan' | 'magenta' | 'yellow' | 'green' | 'orange' | 'red';
```

**Usage Guide**:
- **Cyan** (#00f0ff): Primary actions, data, tech elements
- **Magenta** (#ff00ff): Secondary actions, highlights, creativity
- **Yellow** (#ffff00): Warnings, attention, caution
- **Green** (#00ff00): Success, positive metrics, active states
- **Orange** (#ff6600): Alerts, important info, energy
- **Red** (#ff0000): Errors, danger, critical states

### Status Colors
```typescript
type Status = 'online' | 'offline' | 'warning' | 'loading';
```

**Visual Mapping**:
- **Online**: Green pulse
- **Offline**: Gray static
- **Warning**: Yellow static
- **Loading**: Cyan pulse

### Size System
```typescript
type Size = 'sm' | 'md' | 'lg';
```

**Scale**:
- **sm**: Compact, inline, badges
- **md**: Standard, default size
- **lg**: Prominent, headers, emphasis

---

## 🔌 WebSocket Hooks

### 1. **useMarketData**
`@/hooks/useMarketData`
```tsx
const marketData = useMarketData(['AAPL', 'TSLA']);
// Returns: Record<string, MarketTick>
```

**Returns**:
```typescript
{
  AAPL: {
    symbol: 'AAPL',
    price: 181.25,
    change: 2.75,
    changePercent: 1.54,
    volume: 52000000,
    timestamp: '2024-01-01T10:30:00Z'
  }
}
```

---

### 2. **useRealTimeSignals**
`@/hooks/useRealTimeSignals`
```tsx
const signals = useRealTimeSignals(10); // limit to 10
// Returns: TradingSignal[]
```

**Returns**:
```typescript
[{
  id: 'sig_123',
  timestamp: '2024-01-01T10:30:00Z',
  symbol: 'AAPL',
  strategy: 'Momentum Surfer',
  signal: 'BUY',
  confidence: 0.85,
  price: 181.25,
  reason: 'Strong momentum breakout'
}]
```

---

### 3. **useRiskEvents**
`@/hooks/useRiskEvents`
```tsx
const events = useRiskEvents(20);
// Returns: RiskEvent[]
```

**Returns**:
```typescript
[{
  id: 'risk_456',
  timestamp: '2024-01-01T10:30:00Z',
  severity: 'high',
  type: 'drawdown_alert',
  message: 'Drawdown approaching limit',
  symbol: 'TSLA',
  value: 8.5,
  threshold: 10.0
}]
```

---

### 4. **useAIMessages**
`@/hooks/useAIMessages`
```tsx
const { messages, sendMessage, clearMessages, loading } = useAIMessages();

sendMessage('What is the current market sentiment?');
```

**Returns**:
```typescript
{
  messages: [{
    id: 'msg_789',
    timestamp: '2024-01-01T10:30:00Z',
    role: 'assistant',
    content: 'Market sentiment is bullish...',
    type: 'analysis'
  }],
  sendMessage: (content: string) => void,
  clearMessages: () => void,
  loading: boolean
}
```

---

### 5. **useNewsStream**
`@/hooks/useNewsStream`
```tsx
const news = useNewsStream(30);
// Returns: NewsItem[]
```

**Returns**:
```typescript
[{
  id: 'news_321',
  timestamp: '2024-01-01T10:30:00Z',
  title: 'Apple announces new product',
  summary: 'Apple today announced...',
  source: 'Reuters',
  sentiment: 'positive',
  symbols: ['AAPL'],
  url: 'https://...',
  impact: 'high'
}]
```

---

### 6. **useSystemLogs**
`@/hooks/useSystemLogs`
```tsx
const logs = useSystemLogs(100);
// Returns: LogEntry[]
```

**Returns**:
```typescript
[{
  id: 'log_654',
  timestamp: '2024-01-01T10:30:00Z',
  level: 'info',
  service: 'TradingEngine',
  message: 'Order executed successfully',
  metadata: { orderId: '123', price: 181.25 }
}]
```

---

## 🎯 Common Patterns

### Page Layout
```tsx
<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
  {/* Header */}
  <div className="mb-8">
    <h1 className="text-4xl font-bold text-white mb-2">Page Title</h1>
    <p className="text-gray-400">Description</p>
  </div>

  {/* Metrics Grid */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <MetricCard ... />
  </div>

  {/* Content */}
  <NeonCard glow="cyan">
    {content}
  </NeonCard>
</div>
```

### Data Stream Panel
```tsx
<NeonCard glow="cyan" className="h-full">
  <div className="p-6">
    <h3 className="text-lg font-bold text-white mb-4">Live Signals</h3>
    <DataStream items={streamItems} maxItems={15} autoScroll />
  </div>
</NeonCard>
```

### Status Dashboard
```tsx
<NeonCard glow="cyan" className="p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-6">
      <StatusIndicator status="online" label="System" />
      <StatusIndicator status="online" label="Trading" />
      <StatusIndicator status="warning" label="Risk" />
    </div>
    <NeonBadge variant="green" pulse>OPERATIONAL</NeonBadge>
  </div>
</NeonCard>
```

### Alert List
```tsx
<div className="space-y-3">
  {alerts.map(alert => (
    <AlertPanel
      key={alert.id}
      title={alert.title}
      message={alert.message}
      type={alert.severity}
      timestamp={alert.timestamp}
    />
  ))}
</div>
```

---

## 🚀 Quick Start

### Import Components
```tsx
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { MetricCard } from '@/components/neon/MetricCard';
import { DataStream } from '@/components/neon/DataStream';
```

### Import Hooks
```tsx
import { useMarketData } from '@/hooks/useMarketData';
import { useRealTimeSignals } from '@/hooks/useRealTimeSignals';
import { useRiskEvents } from '@/hooks/useRiskEvents';
```

### Basic Usage
```tsx
export default function MyPage() {
  const signals = useRealTimeSignals(10);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <NeonCard glow="cyan">
        <DataStream 
          items={signals.map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            type: s.signal === 'BUY' ? 'buy' : 'sell',
            message: `${s.strategy}: ${s.signal} ${s.symbol}`,
            value: `${(s.confidence * 100).toFixed(0)}%`
          }))}
          autoScroll
        />
      </NeonCard>
    </div>
  );
}
```

---

## 📊 Component Stats

| Component | Lines | Complexity | Reusability |
|-----------|-------|-----------|-------------|
| NeonCard | 70 | Low | High |
| NeonButton | 60 | Low | High |
| ReactorCore | 80 | Medium | Medium |
| AIOrb | 90 | Medium | Low |
| DataStream | 100 | Medium | High |
| StatusIndicator | 50 | Low | High |
| NeonBadge | 40 | Low | High |
| MetricCard | 80 | Low | High |
| AlertPanel | 70 | Low | High |
| Modal | 120 | Medium | High |
| NeonTabs | 80 | Low | High |

**Total**: ~940 lines of component code

---

## 🎨 Theming

### Extending Components
All components accept `className` for custom styling:

```tsx
<NeonCard 
  glow="cyan"
  className="custom-class additional-styling"
>
  {children}
</NeonCard>
```

### Custom Glow Colors
Add new colors in `tailwind.config.js`:

```javascript
neon: {
  cyan: '#00f0ff',
  custom: '#your-color'
}
```

Then use in components:
```tsx
<NeonCard glow="custom" />
```

---

## 📝 Notes

- All components are TypeScript-safe
- All components support dark mode (default)
- All animations use GPU acceleration
- All components are responsive
- All components follow accessibility guidelines

---

*Component Library Version: 1.0*
*Last Updated: Phase 5 Session 1*
