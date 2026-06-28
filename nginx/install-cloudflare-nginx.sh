#!/usr/bin/env bash
# Install Cloudflare real-IP trust + refresh CORS maps on the VPS nginx.
set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-/home/backend/nexthire}"
CF_CONF="/etc/nginx/conf.d/cloudflare-real-ip.conf"
CORS_CONF="/etc/nginx/conf.d/cors-map.conf"
DEVQII_SITE="/etc/nginx/sites-available/devqii.me"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root."
  exit 1
fi

cp "$BACKEND_DIR/nginx/cloudflare-real-ip.conf" "$CF_CONF"
cp "$BACKEND_DIR/nginx/cors-map.conf" "$CORS_CONF"

# Use conditional CORS maps (no headers for blocked origins)
perl -i -pe '
  s/add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;/add_header Access-Control-Allow-Methods \$cors_allow_methods always;/g;
  s/add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;/add_header Access-Control-Allow-Headers \$cors_allow_headers always;/g;
  s/add_header Access-Control-Allow-Credentials "true" always;/add_header Access-Control-Allow-Credentials \$cors_allow_credentials always;/g;
  s/add_header Access-Control-Max-Age 86400 always;/add_header Access-Control-Max-Age \$cors_max_age always;/g;
' "$DEVQII_SITE"

if [[ -f /etc/nginx/sites-enabled/devqii.me ]] && [[ ! -L /etc/nginx/sites-enabled/devqii.me ]]; then
  cp "$DEVQII_SITE" /etc/nginx/sites-enabled/devqii.me
fi

nginx -t
systemctl reload nginx
echo "Cloudflare real-IP + CORS maps installed."