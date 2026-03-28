#!/bin/sh
set -e

SED_INPLACE="sed -i"

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
CHAT_URL=$(jq --raw-output '.chat_url // "http://192.168.1.2:3001"' /data/options.json)

echo "[INFO] HA URL: ${HA_URL}"
echo "[INFO] Chat URL: ${CHAT_URL}"
echo "[INFO] User token: ${HA_TOKEN:+SET}"
echo "[INFO] Supervisor token: ${SUPERVISOR_TOKEN:+SET}"

chmod -R 755 /usr/share/nginx/html
chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

# Inject runtime config into index.html
echo "[INFO] Injecting runtime configuration..."
$SED_INPLACE 's|<script src="./config.js"></script>|<script>window.HA_CONFIG={url:"'"${HA_URL}"'",token:"'"${HA_TOKEN}"'",supervisorToken:"'"${SUPERVISOR_TOKEN}"'",useIngress:true,useProxy:true};</script>|' /usr/share/nginx/html/index.html

# Configure nginx proxy
PROXY_TOKEN="${HA_TOKEN:-${SUPERVISOR_TOKEN}}"
$SED_INPLACE "s|%%HA_URL%%|${HA_URL}|g" /etc/nginx/nginx.conf
$SED_INPLACE "s|%%HA_TOKEN%%|${PROXY_TOKEN}|g" /etc/nginx/nginx.conf
$SED_INPLACE "s|%%CHAT_URL%%|${CHAT_URL}|g" /etc/nginx/nginx.conf

echo "[INFO] Testing nginx configuration..."
nginx -t

echo "[INFO] Starting nginx on port 8100..."
exec nginx -g "daemon off;"
