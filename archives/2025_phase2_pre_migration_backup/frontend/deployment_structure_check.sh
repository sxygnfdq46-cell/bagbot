#!/bin/bash
echo "Checking Render deployment structure..."

if [ -d "bagbot/frontend" ]; then
  echo "✓ bagbot/frontend exists"
else
  echo "❌ ERROR: missing frontend folder"
  exit 1
fi

if [ -f "bagbot/frontend/package.json" ]; then
  echo "✓ package.json found"
else
  echo "❌ package.json missing"
  exit 1
fi

if [ -f "bagbot/frontend/package-lock.json" ]; then
  echo "✓ package-lock.json found"
else
  echo "❌ package-lock.json missing"
  exit 1
fi

if [ -f "bagbot/frontend/next.config.js" ]; then
  echo "✓ next.config.js found"
else
  echo "❌ next.config.js missing"
  exit 1
fi

if grep -q "output: 'standalone'" bagbot/frontend/next.config.js; then
  echo "✓ next.config.js has standalone output"
else
  echo "❌ next.config.js missing standalone output"
  exit 1
fi

echo ""
echo "✅ All deployment structure checks passed!"
