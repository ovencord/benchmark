#!/bin/bash

# Benchmark Runner @ovencord vs discord.js
# Philosophy: Head-to-Head performance analysis

LOG_FILE="bench_results_$(date +%s).json"

echo "🚀 Starting Head-to-Head Benchmark..."

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Create it from .env.example first."
    exit 1
fi

echo "🏗️ Building containers..."
docker compose build --no-cache

echo "🏁 Launching bots with 1 vCPU and 512MB RAM limits..."
docker compose up -d

echo "📊 Logging data to $LOG_FILE (Press Ctrl+C to stop)"
echo "----------------------------------------------------"

# Capture logs and filter for JSON outputs from our bots
# We remove the docker prefix for clean JSON parsing later
docker compose logs -f | grep '{"type":' >> "$LOG_FILE" &

# Wait for user to stop the benchmark
trap "echo 'Stopping...'; docker compose down; exit" INT
wait
