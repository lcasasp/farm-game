#!/usr/bin/env bash
# Creates the bunny-farm Railway project + two services via the Railway GraphQL API.
# Run once: bash infra/setup.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load RAILWAY_TOKEN from .env if not already set
if [ -z "${RAILWAY_TOKEN:-}" ] && [ -f "$ROOT_DIR/.env" ]; then
  RAILWAY_TOKEN="$(grep -E '^RAILWAY_TOKEN=' "$ROOT_DIR/.env" | cut -d= -f2- | tr -d '[:space:]')"
fi

if [ -z "${RAILWAY_TOKEN:-}" ]; then
  echo "Error: RAILWAY_TOKEN not found in environment or .env"
  exit 1
fi

API="https://backboard.railway.app/graphql/v2"

gql() {
  curl -sf -X POST "$API" \
    -H "Authorization: Bearer $RAILWAY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$1"
}

# ── Create project ─────────────────────────────────────────────────────────────
echo "Creating project bunny-farm..."
PROJECT_RESP=$(gql '{"query":"mutation { projectCreate(input: { name: \"bunny-farm\" }) { id name } }"}')
PROJECT_ID=$(echo "$PROJECT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['projectCreate']['id'])" 2>/dev/null || true)

if [ -z "$PROJECT_ID" ]; then
  echo "Failed to create project. Full response:"
  echo "$PROJECT_RESP"
  exit 1
fi
echo "  Project ID: $PROJECT_ID"

# ── Create backend-prod ────────────────────────────────────────────────────────
echo "Creating service backend-prod..."
PROD_RESP=$(gql "{\"query\":\"mutation { serviceCreate(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"backend-prod\\\" }) { id name } }\"}")
PROD_ID=$(echo "$PROD_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['serviceCreate']['id'])" 2>/dev/null || true)

if [ -z "$PROD_ID" ]; then
  echo "Failed to create backend-prod. Full response:"
  echo "$PROD_RESP"
  exit 1
fi
echo "  backend-prod ID: $PROD_ID"

# ── Create backend-sandbox ─────────────────────────────────────────────────────
echo "Creating service backend-sandbox..."
SANDBOX_RESP=$(gql "{\"query\":\"mutation { serviceCreate(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"backend-sandbox\\\" }) { id name } }\"}")
SANDBOX_ID=$(echo "$SANDBOX_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['serviceCreate']['id'])" 2>/dev/null || true)

if [ -z "$SANDBOX_ID" ]; then
  echo "Failed to create backend-sandbox. Full response:"
  echo "$SANDBOX_RESP"
  exit 1
fi
echo "  backend-sandbox ID: $SANDBOX_ID"

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "Done. Record these IDs:"
echo "  RAILWAY_PROJECT_ID=$PROJECT_ID"
echo "  RAILWAY_PROD_SERVICE_ID=$PROD_ID"
echo "  RAILWAY_SANDBOX_SERVICE_ID=$SANDBOX_ID"
echo ""
echo "Next steps:"
echo "  1. Open Railway dashboard → connect GitHub repo to each service (root dir: backend)"
echo "  2. Set env vars in Railway dashboard for each service (see README)"
echo "  3. Update EXPO_PUBLIC_API_URL and EXPO_PUBLIC_SANDBOX_API_URL in .env"
