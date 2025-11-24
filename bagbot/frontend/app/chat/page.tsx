'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Home, MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';
import PageContent from '@/components/Layout/PageContent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI trading assistant. I can help with strategies, market analysis, troubleshooting, and more. What would you like to know?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/systems/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, session_id: 'default' })
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'I apologize, but I couldn\'t process that request.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What strategy should I use right now?",
    "What's the current market bias?",
    "How do I fix API errors?",
    "Explain order blocks strategy",
    "What are my risk settings?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/chat" />
      <PageContent>
        <div className="max-w-5xl mx-auto h-[calc(100vh-200px)] flex flex-col">
          {/* Header */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span className="text-[#FFFBE7]/30">/</span>
            <span className="text-[#F9D949] font-semibold">AI Chat Helper</span>
          </nav>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black text-[#FFFBE7] mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[#F9D949]" />
              AI Trading Assistant
            </h1>
            <p className="text-sm text-[#FFFBE7]/70">
              Ask me anything about strategies, market conditions, or troubleshooting
            </p>
          </div>

          {/* Chat Container */}
          <div className="flex-1 flex flex-col rounded-2xl bg-gradient-to-br from-[#1a0a0f] to-black border-2 border-[#7C2F39]/30 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F9D949]/20 border border-[#F9D949]/50 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-[#F9D949]" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[#7C2F39]/20 border border-[#7C2F39]/50 text-[#FFFBE7]'
                        : 'bg-black/50 border border-[#F9D949]/30 text-[#FFFBE7]'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs text-[#FFFBE7]/40 mt-2 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7C2F39]/20 border border-[#7C2F39]/50 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#F9D949]" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F9D949]/20 border border-[#F9D949]/50 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#F9D949]" />
                  </div>
                  <div className="max-w-[70%] p-4 rounded-2xl bg-black/50 border border-[#F9D949]/30">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#F9D949] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#F9D949] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#F9D949] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-6 pb-4">
                <p className="text-xs text-[#FFFBE7]/60 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(question)}
                      className="px-3 py-1.5 rounded-lg bg-[#7C2F39]/20 border border-[#7C2F39]/50 text-xs text-[#F9D949] hover:bg-[#7C2F39]/30 transition-all"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t-2 border-[#7C2F39]/30">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/50 border-2 border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/40 focus:border-[#F9D949]/50 focus:outline-none transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C2F39] to-[#F9D949] text-black font-bold hover:shadow-lg hover:shadow-[#F9D949]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
