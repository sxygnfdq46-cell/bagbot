/**
 * AI Chat Service - AI Assistant Integration
 * SAFE: Read-only AI query + message history
 */

import { api } from '@/lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    processing_time?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface AIQuery {
  message: string;
  context?: Record<string, any>;
  session_id?: string;
}

export interface AIResponse {
  message: string;
  session_id: string;
  suggestions?: string[];
  data?: any;
  sources?: Array<{
    type: string;
    content: string;
    relevance: number;
  }>;
}

export interface AICapabilities {
  available: boolean;
  models: string[];
  features: string[];
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
  };
}

/**
 * Send query to AI assistant
 */
export async function queryAI(query: AIQuery): Promise<AIResponse> {
  return api.post('/api/ai/query', query);
}

/**
 * Get chat session history
 */
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  return api.get(`/api/ai/session/${sessionId}/messages`);
}

/**
 * Get all chat sessions
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  return api.get('/api/ai/sessions');
}

/**
 * Create new chat session
 */
export async function createChatSession(title?: string): Promise<ChatSession> {
  return api.post('/api/ai/session', { title });
}

/**
 * Delete chat session
 */
export async function deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
  return api.delete(`/api/ai/session/${sessionId}`);
}

/**
 * Rename chat session
 */
export async function renameChatSession(
  sessionId: string,
  title: string
): Promise<ChatSession> {
  return api.patch(`/api/ai/session/${sessionId}`, { title });
}

/**
 * Get AI capabilities and status
 */
export async function getAICapabilities(): Promise<AICapabilities> {
  return api.get('/api/ai/capabilities');
}

/**
 * Upload file for AI analysis
 */
export async function uploadFile(
  file: File,
  sessionId?: string
): Promise<{
  file_id: string;
  analysis?: any;
}> {
  const formData = new FormData();
  formData.append('file', file);
  if (sessionId) formData.append('session_id', sessionId);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/ai/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

/**
 * Get suggested prompts/questions
 */
export async function getSuggestedPrompts(context?: string): Promise<string[]> {
  const params = context ? `?context=${encodeURIComponent(context)}` : '';
  return api.get(`/api/ai/suggestions${params}`);
}

/**
 * Stream AI response (for real-time typing effect)
 */
export async function* streamAIResponse(
  query: AIQuery
): AsyncGenerator<string, void, unknown> {
  const endpoint = '/api/ai/stream';
  
  for await (const data of api.stream(endpoint)) {
    if (typeof data === 'string') {
      yield data;
    } else if (data.chunk) {
      yield data.chunk;
    }
  }
}

/**
 * Get AI conversation context
 */
export async function getConversationContext(
  sessionId: string
): Promise<Record<string, any>> {
  return api.get(`/api/ai/session/${sessionId}/context`);
}

export const aiService = {
  query: queryAI,
  getChatHistory,
  getSessions: getChatSessions,
  createSession: createChatSession,
  deleteSession: deleteChatSession,
  renameSession: renameChatSession,
  getCapabilities: getAICapabilities,
  uploadFile,
  getSuggestions: getSuggestedPrompts,
  stream: streamAIResponse,
  getContext: getConversationContext,
};

export default aiService;
