'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { GlassInput } from '@/design-system/components/inputs/GlassInput';
import { HoloButton } from '@/design-system/components/buttons/HoloButton';
import { useTheme } from '../providers';
import { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPI, useAPIMutation } from '@/lib/hooks/useAPI';
import { AIAura, ParticleUniverse, HoloRefract } from '@/components/quantum/QuantumEffects';
import { AIEmotionAura, TemporalDisplacement } from '@/components/ascension/AscensionEffects';

export default function ChatPage() {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [aiState, setAIState] = useState<'idle' | 'receiving' | 'processing' | 'active'>('idle');
  const [aiEmotion, setAiEmotion] = useState<'curious' | 'thinking' | 'excited' | 'confused' | 'confident' | 'idle'>('thinking');

  // Fetch chat history
  const { data: chatHistory } = useAPI<any[]>('/api/ai/history?limit=50');

  // Send message mutation
  const queryAI = useAPIMutation('/api/ai/query', 'POST');

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setAIState('receiving');
    const userMessage = { role: 'user', content: message, time: new Date().toLocaleTimeString() };
    setLocalMessages([...localMessages, userMessage]);
    setMessage('');
    
    try {
      setAIState('processing');
      setAiEmotion('thinking');
      const response = await queryAI({ message: message.trim() });
      const assistantMessage = { 
        role: 'assistant', 
        content: response.response || 'Response received', 
        time: new Date().toLocaleTimeString() 
      };
      setAIState('active');
      setAiEmotion('confident');
      setLocalMessages((prev) => [...prev, assistantMessage]);
      setTimeout(() => {
        setAIState('idle');
        setAiEmotion('idle');
      }, 2000);
    } catch (error) {
      console.error('AI query failed:', error);
      setAIState('idle');
      setAiEmotion('confused');
      setTimeout(() => setAiEmotion('idle'), 3000);
    }
  };

  const messages = [...(chatHistory ?? []), ...localMessages].slice(-20);

  const suggestions = [
    '📊 Analyze current portfolio performance',
    '🎯 Suggest strategy optimizations',
    '⚠️ Review risk exposure',
    '📈 Market outlook for next 24h',
  ];

  return (
    <SciFiShell>
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
        {/* LEVEL 5: AI Emotion Aura */}
        <AIEmotionAura emotion={aiEmotion} intensity={0.8}>
        {/* LEVEL 5: Temporal Displacement */}
        <TemporalDisplacement active={aiState === 'processing'}>
        <AIAura state={aiState}>
      <div className="space-y-6 h-full flex flex-col">
        {/* Page Header */}
        <div>
          <AnimatedText variant="breathe-cyan">
          <h1 
            className="text-4xl font-bold neon-text mb-2"
            style={{ color: theme.colors.neonCyan }}
          >
            AI Assistant
          </h1>
          </AnimatedText>
          <p style={{ color: theme.text.tertiary }}>
            Chat with your intelligent trading copilot
          </p>
        </div>

        {/* Chat Container */}
        <AnimatedCard variant="pulse-cyan" delay={100}>
        <HoloCard glowColor="cyan" className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[70%] p-4 rounded-lg"
                  style={{
                    background: msg.role === 'user' 
                      ? 'rgba(0, 246, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${msg.role === 'user' ? theme.border.active : theme.border.subtle}`,
                    boxShadow: msg.role === 'user' ? theme.shadows.glow.soft : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold" style={{ color: theme.colors.neonCyan }}>
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-xs" style={{ color: theme.text.tertiary }}>
                      {msg.time}
                    </span>
                  </div>
                  <p style={{ color: theme.text.primary }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="mb-4">
            <div className="text-sm mb-2" style={{ color: theme.text.tertiary }}>
              Quick Actions:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="p-3 rounded text-left text-sm transition-smooth hover-lift hover-glow"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme.border.subtle}`,
                    color: theme.text.secondary,
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-3">
            <GlassInput
              placeholder="Ask me anything about your trading..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <HoloButton variant="primary" size="md" className="hover-lift hover-glow transition-smooth">
              Send →
            </HoloButton>
          </div>
        </HoloCard>
        </AnimatedCard>

        {/* AI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Questions Today', value: '47', icon: '💬' },
            { label: 'Accuracy', value: '94.2%', icon: '🎯' },
            { label: 'Avg Response', value: '1.2s', icon: '⚡' },
            { label: 'Insights Given', value: '28', icon: '💡' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="p-4 rounded glass-panel holo-border animate-fade-in-up"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${theme.border.default}`,
                animationDelay: `${0.1 + idx * 0.1}s`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-sm" style={{ color: theme.text.tertiary }}>
                  {stat.label}
                </span>
              </div>
              <div 
                className="text-2xl font-bold"
                style={{ color: theme.colors.neonCyan }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      </AIAura>
      </TemporalDisplacement>
      </AIEmotionAura>
      </PageTransition>
    </SciFiShell>
  );
}
