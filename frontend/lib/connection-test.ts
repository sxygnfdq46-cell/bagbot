/**
 * API Connection Test
 * Tests all API endpoints and WebSocket connection
 */

import { apiClient } from '@/lib/api-client';
import { login, isAuthenticated } from '@/services/auth';
import { getBotStatus, getLiveMetrics } from '@/services/bot';
import { botWebSocket } from '@/lib/websocket-client';

export interface ConnectionTestResult {
  name: string;
  status: 'success' | 'error';
  message: string;
  duration?: number;
}

/**
 * Test API connection
 */
export async function testAPIConnection(): Promise<ConnectionTestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
    const duration = Date.now() - start;
    
    if (response.ok) {
      return {
        name: 'API Connection',
        status: 'success',
        message: `Backend is reachable (${duration}ms)`,
        duration,
      };
    } else {
      return {
        name: 'API Connection',
        status: 'error',
        message: `Backend returned status ${response.status}`,
        duration,
      };
    }
  } catch (error) {
    return {
      name: 'API Connection',
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
      duration: Date.now() - start,
    };
  }
}

/**
 * Test authentication endpoints
 */
export async function testAuthEndpoints(): Promise<ConnectionTestResult[]> {
  const results: ConnectionTestResult[] = [];

  // Test login endpoint (will fail without valid credentials, but confirms endpoint exists)
  const loginStart = Date.now();
  try {
    await login({ email: 'test@example.com', password: 'test123' });
    results.push({
      name: 'Auth Login',
      status: 'success',
      message: 'Login endpoint is working',
      duration: Date.now() - loginStart,
    });
  } catch (error) {
    // Expected to fail with invalid credentials, but endpoint should exist
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isEndpointError = message.includes('404') || message.includes('not found');
    
    results.push({
      name: 'Auth Login',
      status: isEndpointError ? 'error' : 'success',
      message: isEndpointError ? 'Login endpoint not found' : 'Login endpoint exists',
      duration: Date.now() - loginStart,
    });
  }

  return results;
}

/**
 * Test bot endpoints
 */
export async function testBotEndpoints(): Promise<ConnectionTestResult[]> {
  const results: ConnectionTestResult[] = [];

  // Test bot status endpoint
  const statusStart = Date.now();
  try {
    await getBotStatus();
    results.push({
      name: 'Bot Status',
      status: 'success',
      message: 'Bot status endpoint is working',
      duration: Date.now() - statusStart,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      name: 'Bot Status',
      status: 'error',
      message: `Bot status error: ${message}`,
      duration: Date.now() - statusStart,
    });
  }

  // Test bot metrics endpoint
  const metricsStart = Date.now();
  try {
    await getLiveMetrics();
    results.push({
      name: 'Bot Metrics',
      status: 'success',
      message: 'Bot metrics endpoint is working',
      duration: Date.now() - metricsStart,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      name: 'Bot Metrics',
      status: 'error',
      message: `Bot metrics error: ${message}`,
      duration: Date.now() - metricsStart,
    });
  }

  return results;
}

/**
 * Test WebSocket connection
 */
export async function testWebSocketConnection(): Promise<ConnectionTestResult> {
  const start = Date.now();
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      botWebSocket.disconnect();
      resolve({
        name: 'WebSocket Connection',
        status: 'error',
        message: 'WebSocket connection timeout',
        duration: Date.now() - start,
      });
    }, 5000);

    botWebSocket.connect()
      .then(() => {
        clearTimeout(timeout);
        const duration = Date.now() - start;
        
        if (botWebSocket.isConnected()) {
          resolve({
            name: 'WebSocket Connection',
            status: 'success',
            message: `WebSocket connected (${duration}ms)`,
            duration,
          });
        } else {
          resolve({
            name: 'WebSocket Connection',
            status: 'error',
            message: 'WebSocket failed to connect',
            duration,
          });
        }
        
        botWebSocket.disconnect();
      })
      .catch((error) => {
        clearTimeout(timeout);
        resolve({
          name: 'WebSocket Connection',
          status: 'error',
          message: error instanceof Error ? error.message : 'WebSocket error',
          duration: Date.now() - start,
        });
      });
  });
}

/**
 * Run all connection tests
 */
export async function runAllTests(): Promise<{
  passed: number;
  failed: number;
  results: ConnectionTestResult[];
}> {
  const results: ConnectionTestResult[] = [];

  // Test API connection
  results.push(await testAPIConnection());

  // Test auth endpoints
  const authResults = await testAuthEndpoints();
  results.push(...authResults);

  // Test bot endpoints
  const botResults = await testBotEndpoints();
  results.push(...botResults);

  // Test WebSocket
  results.push(await testWebSocketConnection());

  const passed = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  return { passed, failed, results };
}
