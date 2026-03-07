#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

export APP_BASE_URL="${APP_BASE_URL:-http://localhost:${HAAABIT_PUBLIC_PORT:-8080}}"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-12345678901234567890123456789012}"

cleanup() {
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

cleanup
docker compose build web api
docker compose run --rm migrate
docker compose up -d
./scripts/self-host/check.sh
