#!/bin/bash
set -e

echo "Building Health Dashboard Add-on..."

echo "Building health context from OpenClaw workspace..."
npx tsx scripts/build-health-context.ts

echo "Building Next.js app..."
npm run build

echo "Copying build to health-dashboard directory..."
rm -rf health-dashboard/build
cp -r out health-dashboard/build

echo "Injecting runtime config loader..."
# Detect OS for sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's|<head>|<head>\n    <script src="./config.js"></script>|' health-dashboard/build/index.html
else
  sed -i 's|<head>|<head>\n    <script src="./config.js"></script>|' health-dashboard/build/index.html
fi

echo "Preparing chat server for add-on..."
rm -rf health-dashboard/chat-server
mkdir -p health-dashboard/chat-server

# Compile TypeScript chat server to JS
npx tsc chat-server/index.ts --outDir health-dashboard/chat-server \
  --esModuleInterop --resolveJsonModule --moduleResolution node \
  --target ES2020 --module commonjs --skipLibCheck 2>/dev/null || {
  echo "tsc failed, using tsx to compile..."
  npx tsx --eval "
    const { execSync } = require('child_process');
    execSync('cp chat-server/index.ts health-dashboard/chat-server/index.ts');
  "
}

# Copy health context and package.json
cp chat-server/health-context.json health-dashboard/chat-server/
cp chat-server/package.json health-dashboard/chat-server/

echo "Add-on build complete!"
echo ""
echo "Next steps:"
echo "1. Copy 'health-dashboard' folder to your HA at: /config/addons/health-dashboard/"
echo "2. In HA: Settings > Add-ons > menu > Check for updates"
echo "3. Install and start the 'Health Dashboard' add-on"
echo "4. Configure 'anthropic_api_key' in add-on settings for chat"
