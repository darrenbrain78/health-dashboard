#!/bin/sh
set -e

if [ "$(uname)" = "Darwin" ]; then
  SED_INPLACE="sed -i ''"
else
  SED_INPLACE="sed -i"
fi

echo "[INFO] Starting Health Dashboard..."

SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"

if [ -n "${SUPERVISOR_TOKEN}" ]; then
    HA_URL="http://supervisor/core"
    echo "[INFO] Running as HA add-on - using Supervisor API"
else
    HA_URL=$(jq --raw-output '.ha_url // "http://192.168.1.2:8123"' /data/options.json)
    echo "[INFO] Development mode - using configured URL"
fi

HA_TOKEN=$(jq --raw-output '.ha_token // ""' /data/options.json)
ANTHROPIC_API_KEY=$(jq --raw-output '.anthropic_api_key // ""' /data/options.json)

echo "[INFO] HA URL: ${HA_URL}"
echo "[INFO] User token: ${HA_TOKEN:+SET}"
echo "[INFO] Supervisor token: ${SUPERVISOR_TOKEN:+SET}"
echo "[INFO] Anthropic key: ${ANTHROPIC_API_KEY:+SET}"

chmod -R 755 /usr/share/nginx/html
chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

# Inject runtime config into index.html
echo "[INFO] Injecting runtime configuration..."
$SED_INPLACE 's|<script src="./config.js"></script>|<script>window.HA_CONFIG={url:"'"${HA_URL}"'",token:"'"${HA_TOKEN}"'",supervisorToken:"'"${SUPERVISOR_TOKEN}"'",useIngress:true,useProxy:true};</script>|' /usr/share/nginx/html/index.html

# Configure nginx proxy
PROXY_TOKEN="${HA_TOKEN:-${SUPERVISOR_TOKEN}}"
$SED_INPLACE "s|%%HA_URL%%|${HA_URL}|g" /etc/nginx/nginx.conf
$SED_INPLACE "s|%%HA_TOKEN%%|${PROXY_TOKEN}|g" /etc/nginx/nginx.conf

echo "[INFO] Testing nginx configuration..."
nginx -t

# Start chat server in background
if [ -d /opt/chat-server ] && [ -n "${ANTHROPIC_API_KEY}" ]; then
    echo "[INFO] Starting chat server on port 3001..."
    ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" CHAT_PORT=3001 node /opt/chat-server/index.js &
    CHAT_PID=$!
    echo "[INFO] Chat server PID: ${CHAT_PID}"
else
    echo "[WARN] Chat server not started (missing API key or chat-server dir)"
fi

echo "[INFO] Starting nginx on port 8100..."
exec nginx -g "daemon off;"
