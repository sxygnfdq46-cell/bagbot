#!/bin/bash
# Health check script for monitoring
# Returns 0 if healthy, 1 if unhealthy

API_URL="http://localhost:8000/api/health"
TIMEOUT=5

response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$API_URL" 2>/dev/null)

if [ "$response" = "200" ]; then
    echo "✅ Healthy"
    exit 0
else
    echo "❌ Unhealthy (HTTP $response)"
    exit 1
fi
