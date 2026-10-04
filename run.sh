#!/usr/bin/env bash
# Local dev runner: ./run.sh  (reads .env if present)
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
if [ ! -f .env ]; then
  echo "No .env found — copy .env.example to .env and set ADMIN_PASSWORD" >&2
fi
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --reload
