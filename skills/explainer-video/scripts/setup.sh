#!/usr/bin/env bash
# One-time setup: install the render dependencies next to the scripts and check for a browser.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d node_modules/playwright-core ] || [ ! -d node_modules/ffmpeg-static ]; then
  npm ci --no-audit --no-fund --omit=dev
fi

# ffmpeg-static downloads its binary in an install script; newer npm versions may skip it.
if ! node -e "const p=require('ffmpeg-static'); if(!p||!require('fs').existsSync(p)) process.exit(1)" 2>/dev/null; then
  echo "Fetching the ffmpeg binary..."
  node node_modules/ffmpeg-static/install.js || true
fi
if node -e "const p=require('ffmpeg-static'); if(!p||!require('fs').existsSync(p)) process.exit(1)" 2>/dev/null; then
  echo "ffmpeg: $(node -e "console.log(require('ffmpeg-static'))")"
elif command -v ffmpeg >/dev/null; then
  echo "ffmpeg: $(command -v ffmpeg) (system)"
else
  echo "No ffmpeg found. Install it with: brew install ffmpeg" >&2
  exit 1
fi

# Prefer the installed Google Chrome; otherwise download Playwright's Chromium.
if [ -d "/Applications/Google Chrome.app" ] || command -v google-chrome >/dev/null || command -v google-chrome-stable >/dev/null; then
  echo "browser: Google Chrome"
else
  echo "Google Chrome not found; installing Playwright Chromium..."
  npx playwright-core install chromium
fi
echo "Ready."
