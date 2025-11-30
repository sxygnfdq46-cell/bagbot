# AI Helper UI Implementation Guide

## Overview
The AI Chat Helper is a full-screen conversational interface that allows users to interact with BAGBOT's AI assistant for trading questions, strategy explanations, risk diagnostics, and system information.

---

## Architecture

### Component Structure
```
/app/ai-helper/page.tsx
├── Header (AIOrb + Title + StatusIndicator)
├── Quick Prompts Panel (6 categorized actions)
├── Chat Container
│   ├── Message History (scrollable)
│   ├── Thinking Indicator (animated)
│   └── Input Area (autocomplete + send button)
└── Help Panel (capabilities description)
```

---

## Features

### 1. Message System

**Message Types**:
- **User Messages**: Right-aligned, cyan gradient background
- **AI Messages**: Left-aligned, gray gradient background with AIOrb icon

**Message Categories** (AI responses only):
- `strategy` (cyan) - Strategy explanations and analysis
- `market` (magenta) - Market conditions and analysis
- `risk` (yellow) - Risk diagnostics and warnings
- `knowledge` (green) - PDF document concepts and lookup
- `system` (cyan) - System information and Q&A
- `error` (red) - Error interpretations and troubleshooting

**Message Interface**:
```typescript
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  category?: 'strategy' | 'market' | 'risk' | 'knowledge' | 'system' | 'error';
  timestamp: Date;
}
```

---

### 2. Quick Action Prompts

Pre-configured prompts for common questions:

```typescript
const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    label: 'Explain current strategy',
    category: 'strategy',
    prompt: 'Explain the active Order Block strategy and how it identifies entry points'
  },
  {
    icon: Shield,
    label: 'Risk status check',
    category: 'risk',
    prompt: 'What is my current risk exposure and drawdown status?'
  },
  {
    icon: Brain,
    label: 'Market analysis',
    category: 'market',
    prompt: 'Analyze the current market regime and provide trading recommendations'
  },
  {
    icon: BookOpen,
    label: 'Knowledge lookup',
    category: 'knowledge',
    prompt: 'What are the key concepts from Trading in the Zone that apply now?'
  },
  {
    icon: Code,
    label: 'System diagnostics',
    category: 'system',
    prompt: 'Run a full system health check and report any issues'
  },
  {
    icon: Zap,
    label: 'Performance summary',
    category: 'strategy',
    prompt: 'Summarize my trading performance over the last 7 days'
  },
];
```

**Interaction**:
- Click any quick prompt
- Prompt auto-fills input field
- Auto-sends after 100ms delay

---

### 3. Autocomplete System

**Trigger**: Activates when user types 2+ characters

**Pre-configured Suggestions**:
```typescript
const AUTOCOMPLETE_SUGGESTIONS = [
  'Explain the Fair Value Gap strategy',
  'What is causing the current drawdown?',
  'How do I improve my win rate?',
  'Show me liquidity sweep opportunities',
  'What does the HTF bias indicate?',
  'Analyze BTCUSDT market structure',
  'Why was this trade rejected?',
  'What is my current risk multiplier?',
  'Compare Order Block vs Breaker Block strategies',
  'How to adjust position sizing?',
];
```

**Filtering Logic**:
```typescript
const filtered = AUTOCOMPLETE_SUGGESTIONS.filter(suggestion =>
  suggestion.toLowerCase().includes(input.toLowerCase())
);
```

**UI Behavior**:
- Dropdown appears below input
- Shows up to 5 matching suggestions
- Click suggestion → fills input (doesn't send)
- Focus remains on input
- Dismisses when input cleared or focus lost

---

### 4. AI Response Handling

**WebSocket Integration**:
```typescript
const { messages: aiMessages, sendMessage } = useAIMessages();

// Send user message
await sendMessage(input);

// Receive AI response
useEffect(() => {
  if (aiMessages.length > 0) {
    const latestMessage = aiMessages[aiMessages.length - 1];
    // Add to chat history with categorization
    setMessages(prev => [...prev, {
      id: latestMessage.id,
      type: 'ai',
      content: latestMessage.content,
      category: categorizeMessage(latestMessage.content),
      timestamp: new Date(latestMessage.timestamp),
    }]);
    setIsThinking(false);
  }
}, [aiMessages]);
```

**Category Detection** (keyword-based):
```typescript
const categorizeMessage = (content: string): Message['category'] => {
  const lower = content.toLowerCase();
  if (lower.includes('strategy') || lower.includes('order block')) return 'strategy';
  if (lower.includes('market') || lower.includes('trend')) return 'market';
  if (lower.includes('risk') || lower.includes('drawdown')) return 'risk';
  if (lower.includes('document') || lower.includes('concept')) return 'knowledge';
  if (lower.includes('error') || lower.includes('failed')) return 'error';
  return 'system';
};
```

---

### 5. Thinking Indicator

**Animation**:
- 3 cyan dots pulsing sequentially
- Delays: 0s, 0.2s, 0.4s
- Appears when `isThinking = true`
- Positioned in chat feed like AI message

**Implementation**:
```tsx
{isThinking && (
  <div className="flex justify-start">
    <div className="max-w-[80%] rounded-lg p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
      <div className="flex items-center gap-3">
        <AIOrb size="sm" thinking={true} />
        <div className="flex gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
        </div>
      </div>
    </div>
  </div>
)}
```

---

### 6. Auto-Scroll Behavior

**Rules**:
- Auto-scrolls to latest message on new message
- Smooth scroll animation
- Uses ref to target bottom element

**Implementation**:
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// At bottom of messages list
<div ref={messagesEndRef} />
```

---

## Styling

### Color Coding by Category

```typescript
const getCategoryColor = (category?: Message['category']) => {
  switch (category) {
    case 'strategy': return 'cyan';
    case 'market': return 'magenta';
    case 'risk': return 'yellow';
    case 'knowledge': return 'green';
    case 'error': return 'red';
    default: return 'cyan';
  }
};
```

### Message Bubbles

**User Messages**:
```css
max-w-[80%]
bg-gradient-to-br from-cyan-600/20 to-cyan-800/20
border border-cyan-500/30
rounded-lg p-4
justify-end (flex container)
```

**AI Messages**:
```css
max-w-[80%]
bg-gradient-to-br from-gray-800/50 to-gray-900/50
border border-gray-700/50
rounded-lg p-4
justify-start (flex container)
```

---

## API Integration

### Endpoint
```
WebSocket: wss://api.bagbot.ai/ws/ai-chat
```

### Message Protocol

**Send (Client → Server)**:
```json
{
  "type": "user_message",
  "content": "What is my current drawdown?",
  "timestamp": "2024-11-24T12:34:56Z",
  "session_id": "user_session_123"
}
```

**Receive (Server → Client)**:
```json
{
  "id": "msg_abc123",
  "type": "ai_response",
  "content": "Your current drawdown is 5.2%, which is 52% of your 10% maximum limit. This is within safe parameters.",
  "category": "risk",
  "timestamp": "2024-11-24T12:34:58Z",
  "confidence": 0.95
}
```

---

## Usage Examples

### Example Conversations

**1. Strategy Explanation**:
```
User: "Explain the Fair Value Gap strategy"

AI: "The Fair Value Gap (FVG) strategy identifies price imbalances where the market moves too quickly, leaving a 'gap' in fair value. 

Key Rules:
1. Identify 3-candle patterns with a gap
2. Wait for price to return to the gap
3. Enter when price reacts at the gap
4. Target: Previous high/low
5. Stop loss: Beyond the gap

Current Status: FVG strategy is active with 78% confidence, 8 open opportunities detected."
```

**2. Risk Diagnostic**:
```
User: "Why am I seeing risk warnings?"

AI: "Risk warnings are triggered due to:

1. Daily loss at 29% of limit ($145.30 / $500.00)
2. Open correlation between BTCUSD and ETHUSD positions (0.87)
3. Risk multiplier reduced to 0.85x due to recent losses

Recommendations:
- Avoid adding correlated positions
- Consider reducing position sizes
- Wait for risk multiplier to recover above 0.90x"
```

**3. Knowledge Lookup**:
```
User: "What does Trading in the Zone say about emotional discipline?"

AI: "From 'Trading in the Zone' by Mark Douglas (42 concepts extracted):

Key Concept: Emotional Discipline
- Trading is 80% psychology, 20% strategy
- Accept that each trade has an uncertain outcome
- Focus on process, not individual results
- Detach from need to be right
- Trust your edge over large sample size

Related strategies using this concept:
- Mean Reversion Pro (correlation: 92%)
- Risk Management System (correlation: 89%)"
```

---

## Performance Considerations

### Message Limits
- Store max 1000 messages in state
- Older messages automatically pruned
- Use pagination for history (future enhancement)

### WebSocket Optimization
- Throttle typing events (debounce 300ms)
- Batch message updates
- Reconnect on disconnect with exponential backoff

### Rendering Performance
- Virtual scrolling for 1000+ messages (future)
- Memoize message components
- Lazy load AIOrb animations

---

## Accessibility

- Keyboard navigation: Enter to send, Escape to clear
- Focus management: Auto-focus input after send
- Screen reader: ARIA labels on all interactive elements
- Color contrast: All text meets WCAG AA standards
- Reduced motion: Respect `prefers-reduced-motion`

---

## Future Enhancements

1. **Message History Persistence**: Save to localStorage or backend
2. **Voice Input**: Speech-to-text for queries
3. **Rich Responses**: Charts, tables, code blocks in AI responses
4. **Context Awareness**: AI remembers previous conversation
5. **Multi-turn Conversations**: Follow-up questions
6. **Suggested Follow-ups**: AI suggests next questions
7. **Export Chat**: Download conversation as PDF/text
8. **Pinned Messages**: Pin important responses
9. **Search History**: Search past conversations
10. **AI Personality**: Customizable tone (professional/casual/technical)

---

## Troubleshooting

**Issue**: AI not responding
- Check WebSocket connection status
- Verify `useAIMessages` hook is connected
- Check backend logs for errors

**Issue**: Autocomplete not appearing
- Ensure input length > 2 characters
- Check `filteredSuggestions` state
- Verify suggestion matching logic

**Issue**: Messages not scrolling
- Check `messagesEndRef` is attached
- Verify `scrollIntoView` is called
- Check container overflow styles

---

## Component Dependencies

```typescript
import { NeonCard } from '@/components/ui/neon-card';
import { NeonButton } from '@/components/ui/neon-button';
import { AIOrb } from '@/components/ui/ai-orb';
import { DataStream } from '@/components/ui/data-stream';
import { AlertPanel } from '@/components/ui/alert-panel';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useAIMessages } from '@/hooks/useAIMessages';
```

---

*Last Updated: Phase 5.3*
*Status: Production Ready*
