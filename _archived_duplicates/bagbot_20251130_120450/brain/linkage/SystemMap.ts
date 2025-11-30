/**
 * LEVEL 23 — PHASE 1
 * SystemMap.ts
 *
 * This module provides a safe read-only map of backend routes.
 * No trade execution happens here.
 */

export interface Endpoint {
  name: string;
  path: string;
  method: "GET" | "POST";
  secure: boolean;  // true = must pass through safety layers
  description: string;
}

export const SystemMap: Endpoint[] = [
  {
    name: "Heartbeat",
    path: "/api/system/heartbeat",
    method: "GET",
    secure: false,
    description: "Check backend health",
  },
  {
    name: "Market Data Feed",
    path: "/api/market/prices",
    method: "GET",
    secure: false,
    description: "Fetch latest market prices",
  },
  {
    name: "Bot Status",
    path: "/api/bot/status",
    method: "GET",
    secure: false,
    description: "Bot heartbeat + uptime",
  },
  {
    name: "Trade Executor",
    path: "/api/trade/execute",
    method: "POST",
    secure: true,
    description: "High-risk endpoint. Executes actual trades.",
  },
  {
    name: "Trade History",
    path: "/api/trade/history",
    method: "GET",
    secure: true,
    description: "Returns bot execution history",
  },
];
