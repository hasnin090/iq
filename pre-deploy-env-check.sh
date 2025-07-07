#!/bin/bash

echo "🔍 Pre-deployment Environment Check"
echo "=================================="

# Check Node.js
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check for problematic files
if [ -f "runtime.txt" ]; then
  echo "❌ WARNING: runtime.txt found (may cause Python conflicts)"
  cat runtime.txt
else
  echo "✅ No runtime.txt file (good)"
fi

if [ -f ".nvmrc" ]; then
  echo "✅ .nvmrc found: $(cat .nvmrc)"
else
  echo "⚠️ No .nvmrc file"
fi

# Check for Python files
PYTHON_FILES=$(find . -name "*.py" -o -name "requirements.txt" -o -name "Pipfile" 2>/dev/null | wc -l)
if [ "$PYTHON_FILES" -gt 0 ]; then
  echo "⚠️ Python files detected: $PYTHON_FILES"
else
  echo "✅ No Python files detected"
fi

# Check package.json
if [ -f "package.json" ]; then
  echo "✅ package.json found"
  echo "Engine requirements:"
  cat package.json | grep -A 3 '"engines"' || echo "No engine requirements specified"
else
  echo "❌ package.json not found"
fi

echo "=================================="
echo "✅ Environment check complete"
