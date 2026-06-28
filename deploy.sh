#!/bin/bash

set -e

BRANCH="${BRANCH:-websocket}"

if [[ -d .git ]]; then
	echo "🔽 Pulling latest from origin/$BRANCH..."
	git fetch origin "$BRANCH"
	git checkout "$BRANCH"
	git pull --ff-only origin "$BRANCH"
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
$DOCKER_COMPOSE build

echo "🚀 Starting containers..."
$DOCKER_COMPOSE up -d

echo "📊 Showing status..."
$DOCKER_COMPOSE ps

echo "✅ Done!"
