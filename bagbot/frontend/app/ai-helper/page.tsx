'use client';

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { AIOrb } from '@/components/ui/ai-orb';
import { DataStream } from '@/components/ui/data-stream';
import { AlertPanel } from '@/components/ui/alert-panel';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useAIMessages } from '@/hooks/useAIMessages';
import { Send, Sparkles, BookOpen, TrendingUp, Shield, Brain, Code, Zap } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  category?: 'strategy' | 'market' | 'risk' | 'knowledge' | 'system' | 'error';
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Explain current strategy', category: 'strategy', prompt: 'Explain the active Order Block strategy and how it identifies entry points' },
  { icon: Shield, label: 'Risk status check', category: 'risk', prompt: 'What is my current risk exposure and drawdown status?' },
  { icon: Brain, label: 'Market analysis', category: 'market', prompt: 'Analyze the current market regime and provide trading recommendations' },
  { icon: BookOpen, label: 'Knowledge lookup', category: 'knowledge', prompt: 'What are the key concepts from Trading in the Zone that apply now?' },
  { icon: Code, label: 'System diagnostics', category: 'system', prompt: 'Run a full system health check and report any issues' },
  { icon: Zap, label: 'Performance summary', category: 'strategy', prompt: 'Summarize my trading performance over the last 7 days' },
];

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

export default function AIHelperPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI Trading Assistant. I can help you understand strategies, analyze markets, diagnose risks, lookup knowledge from your documents, and explain system behavior. What would you like to know?',
      category: 'system',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages: aiMessages, sendMessage } = useAIMessages();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle AI responses
  useEffect(() => {
    if (aiMessages.length > 0) {
      const latestMessage = aiMessages[aiMessages.length - 1];
      const existingIds = messages.map(m => m.id);
      
      if (!existingIds.includes(latestMessage.id)) {
        setMessages(prev => [...prev, {
          id: latestMessage.id,
          type: 'ai',
          content: latestMessage.content,
          category: categorizeMessage(latestMessage.content),
          timestamp: new Date(latestMessage.timestamp),
        }]);
        setIsThinking(false);
      }
    }
  }, [aiMessages]);

  // Autocomplete filtering
  useEffect(() => {
    if (input.length > 2) {
      const filtered = AUTOCOMPLETE_SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  }, [input]);

  const categorizeMessage = (content: string): Message['category'] => {
    const lower = content.toLowerCase();
    if (lower.includes('strategy') || lower.includes('order block') || lower.includes('fvg')) return 'strategy';
    if (lower.includes('market') || lower.includes('trend') || lower.includes('bullish')) return 'market';
    if (lower.includes('risk') || lower.includes('drawdown') || lower.includes('loss')) return 'risk';
    if (lower.includes('document') || lower.includes('concept') || lower.includes('book')) return 'knowledge';
    if (lower.includes('error') || lower.includes('failed') || lower.includes('issue')) return 'error';
    return 'system';
  };

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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowAutocomplete(false);
    setIsThinking(true);

    // Send to AI
    await sendMessage(input);
  };

  const handleQuickPrompt = async (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
    // Auto-send after a brief delay
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AIOrb size="lg" thinking={isThinking} />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent">
              AI Trading Assistant
            </h1>
            <p className="text-gray-400 mt-1">
              Ask anything about strategies, markets, risks, or your trading system
            </p>
          </div>
        </div>
        <StatusIndicator 
          status={isThinking ? 'processing' : 'active'} 
          label={isThinking ? 'Thinking...' : 'Ready'}
          size="md"
        />
      </div>

      {/* Quick Prompts */}
      <NeonCard glow="cyan" className="p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <NeonButton
              key={idx}
              variant="outline"
              onClick={() => handleQuickPrompt(prompt.prompt)}
              className="flex items-center gap-2 justify-start h-auto py-3 px-4"
            >
              <prompt.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-left text-sm">{prompt.label}</span>
            </NeonButton>
          ))}
        </div>
      </NeonCard>

      {/* Chat Container */}
      <NeonCard glow="magenta" className="p-0 overflow-hidden">
        <div className="h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 border border-cyan-500/30'
                      : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.type === 'ai' && (
                      <AIOrb size="sm" thinking={false} />
                    )}
                    <div className="flex-1">
                      {message.category && message.type === 'ai' && (
                        <div className="mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full bg-${getCategoryColor(message.category)}-500/20 text-${getCategoryColor(message.category)}-400 border border-${getCategoryColor(message.category)}-500/30`}>
                            {message.category}
                          </span>
                        </div>
                      )}
                      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Thinking Indicator */}
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
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-4 bg-gray-900/50">
            {/* Autocomplete Dropdown */}
            {showAutocomplete && (
              <div className="mb-2 bg-gray-800 border border-cyan-500/30 rounded-lg overflow-hidden">
                {filteredSuggestions.slice(0, 5).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about trading, strategies, risks, or your system..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <NeonButton
                onClick={handleSendMessage}
                className="px-6"
                disabled={!input.trim() || isThinking}
              >
                <Send className="w-5 h-5" />
              </NeonButton>
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Ask about strategies, markets, risks, or knowledge base
            </p>
          </div>
        </div>
      </NeonCard>

      {/* Help Panel */}
      <AlertPanel
        type="info"
        title="AI Assistant Capabilities"
        message="I can explain trading strategies, analyze market conditions, diagnose risk issues, lookup concepts from your uploaded documents, interpret system errors, and provide trading recommendations based on your current portfolio state."
      />
    </div>
  );
}
