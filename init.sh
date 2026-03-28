#!/bin/bash
# ConflictWatch Live — Dev Server
# Usage: ./init.sh

echo "🌍 Starting ConflictWatch Live dev server..."
echo ""

# Try npx serve first, then python
if command -v npx &> /dev/null; then
  echo "Using npx serve on http://localhost:3000"
  npx serve . -l 3000
elif command -v python3 &> /dev/null; then
  echo "Using Python HTTP server on http://localhost:8080"
  python3 -m http.server 8080
elif command -v python &> /dev/null; then
  echo "Using Python HTTP server on http://localhost:8080"
  python -m http.server 8080
else
  echo "Error: No suitable server found. Install Node.js (npx) or Python."
  exit 1
fi
