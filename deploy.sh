#!/bin/bash

echo "🔽 Stopping containers..."
docker compose down

echo "🔨 Building containers..."
docker compose build

echo "🚀 Starting containers..."
docker compose up -d

echo "🔁 Restarting nginx..."
docker compose restart nginx

echo "📊 Showing status..."
docker compose ps

echo "✅ Done!"
