#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/switch-env.sh development
#   ./scripts/switch-env.sh staging
#   ./scripts/switch-env.sh production

ENV_NAME="${1:-development}"
SRC_FILE=".env.${ENV_NAME}"
DST_FILE=".env"

if [[ ! -f "$SRC_FILE" ]]; then
  echo "Missing $SRC_FILE. Expected one of: .env.development/.env.staging/.env.production"
  exit 1
fi

cp "$SRC_FILE" "$DST_FILE"
echo "Copied $SRC_FILE -> $DST_FILE"

