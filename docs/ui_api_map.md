# UI-API Mapping Document

## Overview
Map of frontend surfaces to backend API endpoints.

## Architecture Summary
Frontend calls pass through API gateway to worker services.

## API Base URLs
- Local: `http://localhost:8000`
- Production: `https://api.example.com`

## Endpoint Mappings
### 1. Health & Status
- `/api/health` → health banner
- `/api/worker/status` → status widget

### 2. Worker Control
- `/api/worker/start`
- `/api/worker/stop`

## WebSocket Connections
- `ws://localhost:8000/ws/worker` for live updates.

## Error Handling
Frontend shows toast with response error message and logs details.

## Frontend State Management
State stored in React query caches keyed by endpoint path.

Frontend Usage:
```typescript
async function fetchStatus() {
  const res = await fetch('/api/worker/status');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
```
