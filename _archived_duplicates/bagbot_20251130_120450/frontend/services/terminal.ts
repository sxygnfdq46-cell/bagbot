/**
 * Terminal Service - Command Execution & Output Stream
 * SAFE: Read-only command stream + safe command execution
 */

import { api } from '@/lib/api';

export interface Command {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  exit_code?: number;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface CommandHistory {
  id: string;
  command: string;
  status: 'completed' | 'failed';
  exit_code: number;
  timestamp: string;
}

export interface CommandOutput {
  type: 'stdout' | 'stderr';
  data: string;
  timestamp: number;
}

export interface SafeCommand {
  name: string;
  description: string;
  usage: string;
  category: 'system' | 'strategy' | 'market' | 'logs';
}

/**
 * Get available safe commands
 */
export async function getSafeCommands(): Promise<SafeCommand[]> {
  return api.get('/api/terminal/commands');
}

/**
 * Execute a safe command
 */
export async function executeCommand(command: string): Promise<Command> {
  return api.post('/api/terminal/execute', { command });
}

/**
 * Get command status
 */
export async function getCommandStatus(id: string): Promise<Command> {
  return api.get(`/api/terminal/command/${id}`);
}

/**
 * Get command output
 */
export async function getCommandOutput(id: string): Promise<string> {
  return api.get(`/api/terminal/command/${id}/output`);
}

/**
 * Get command history
 */
export async function getCommandHistory(limit: number = 50): Promise<CommandHistory[]> {
  return api.get(`/api/terminal/history?limit=${limit}`);
}

/**
 * Stream command output in real-time
 */
export async function* streamCommandOutput(id: string): AsyncGenerator<CommandOutput, void, unknown> {
  const endpoint = `/api/terminal/command/${id}/stream`;
  
  for await (const data of api.stream(endpoint)) {
    yield data as CommandOutput;
  }
}

/**
 * Cancel running command
 */
export async function cancelCommand(id: string): Promise<{ success: boolean; message: string }> {
  return api.post(`/api/terminal/command/${id}/cancel`);
}

/**
 * Clear command history
 */
export async function clearHistory(): Promise<{ success: boolean }> {
  return api.post('/api/terminal/history/clear');
}

/**
 * Validate command before execution
 */
export async function validateCommand(command: string): Promise<{
  valid: boolean;
  safe: boolean;
  message?: string;
  suggestion?: string;
}> {
  return api.post('/api/terminal/validate', { command });
}

export const terminalService = {
  getSafeCommands,
  execute: executeCommand,
  getStatus: getCommandStatus,
  getOutput: getCommandOutput,
  getHistory: getCommandHistory,
  streamOutput: streamCommandOutput,
  cancel: cancelCommand,
  clearHistory,
  validate: validateCommand,
};

export default terminalService;
