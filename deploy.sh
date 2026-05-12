#!/bin/bash

set -e

if docker compose version >/dev/null 2>&1; then
	DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
	DOCKER_COMPOSE="docker-compose"
else
	echo "❌ Neither 'docker compose' nor 'docker-compose' is available on this host."
	exit 1
fi

echo "🔽 Stopping containers..."
$DOCKER_COMPOSE down

echo "🔨 Building containers..."
$DOCKER_COMPOSE build

echo "🚀 Starting containers..."
$DOCKER_COMPOSE up -d

echo "🔁 Restarting nginx..."
$DOCKER_COMPOSE restart nginx

echo "📊 Showing status..."
$DOCKER_COMPOSE ps

echo "✅ Done!"
