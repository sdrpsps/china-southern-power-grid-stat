#!/bin/sh
set -eu

if [ "${APP_BASE_PATH:-}" = "/__NEXT_RUNTIME_BASE_PATH__" ]; then
  export APP_BASE_PATH=""
fi

node /app/scripts/replace-base-path.mjs

exec "$@"
