#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

APP_BASE_URL="${APP_BASE_URL:-http://localhost:${HAAABIT_PUBLIC_PORT:-8080}}"

echo "==> Checking docker compose services"
running_services="$(docker compose ps --services --status running)"

for service in proxy web api; do
  if ! grep -qx "$service" <<<"$running_services"; then
    echo "Service '$service' is not running"
    exit 1
  fi
done

echo "==> Checking API health endpoint"
health_body="$(curl --fail --silent --show-error "${APP_BASE_URL}/health")"
if [[ "$health_body" != *'"ok":true'* ]]; then
  echo "Unexpected /health response: $health_body"
  exit 1
fi

echo "==> Checking OpenAPI endpoint"
curl --fail --silent --show-error "${APP_BASE_URL}/api/openapi.json" >/dev/null

echo "==> Checking web entrypoint"
homepage="$(curl --fail --silent --show-error "${APP_BASE_URL}/")"
if [[ "$homepage" != *"<html"* && "$homepage" != *"<!DOCTYPE html"* ]]; then
  echo "Unexpected homepage response"
  exit 1
fi

echo "Self-host stack is healthy."
