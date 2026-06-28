#!/bin/bash

set -e

BRANCH="${BRANCH:-websocket}"

if [[ -d .git ]]; then
	echo "🔽 Pulling latest from origin/$BRANCH..."
	git fetch origin "$BRANCH"
	git checkout -B "$BRANCH" "origin/$BRANCH"
	git reset --hard "origin/$BRANCH"
fi

if [[ -f .env ]] && command -v python3 >/dev/null 2>&1; then
	echo "🔗 Ensuring DIRECT_URL for Prisma migrations..."
	python3 nginx/ensure-direct-url.py .env || true
fi

if [[ -f nginx/install-cloudflare-nginx.sh ]] && command -v nginx >/dev/null 2>&1; then
	echo "☁️ Updating nginx Cloudflare real-IP + CORS maps..."
	bash nginx/install-cloudflare-nginx.sh || true
fi

if docker compose version >/dev/null 2>&1; then
	DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
	DOCKER_COMPOSE="docker-compose"
else
	echo "❌ Neither 'docker compose' nor 'docker-compose' is available on this host."
	exit 1
fi

echo "🔽 Stopping containers..."
$DOCKER_COMPOSE down --remove-orphans

echo "🔨 Building containers..."
$DOCKER_COMPOSE build --no-cache

echo "🚀 Starting containers..."
$DOCKER_COMPOSE up -d --force-recreate

echo "🗄️ Checking database migrations..."
sleep 8
docker logs nexthire-backend --tail 40 2>&1 || true

echo "📊 Showing status..."
$DOCKER_COMPOSE ps

echo "✅ Done!"
