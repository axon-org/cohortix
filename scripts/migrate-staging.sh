#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# migrate-staging.sh — Run Supabase migrations against the staging database
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   bash scripts/migrate-staging.sh
#
# Requires:
#   - STAGING_DATABASE_URL in environment OR .env.staging.local file
#   - supabase CLI installed (https://supabase.com/docs/guides/cli)
#   - pnpm installed
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[staging-migrate]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }

# ── Load env ──────────────────────────────────────────────────────────────────
if [[ -f ".env.staging.local" ]]; then
  info "Loading .env.staging.local"
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env.staging.local | xargs)
fi

# ── Validate required vars ────────────────────────────────────────────────────
if [[ -z "${STAGING_DIRECT_URL:-}" ]] && [[ -z "${DIRECT_URL:-}" ]]; then
  error "STAGING_DIRECT_URL (or DIRECT_URL) must be set."
  error "Export it or create .env.staging.local with STAGING_DIRECT_URL=postgresql://..."
  exit 1
fi

MIGRATION_URL="${STAGING_DIRECT_URL:-$DIRECT_URL}"

# ── Safety: confirm environment ────────────────────────────────────────────────
echo ""
warn "You are about to run migrations on STAGING."
warn "URL: ${MIGRATION_URL%:*@*}:***@${MIGRATION_URL##*@}"
echo ""
read -r -p "Type 'staging' to confirm: " CONFIRM
if [[ "$CONFIRM" != "staging" ]]; then
  error "Aborted. You must type exactly: staging"
  exit 1
fi

# ── Run Drizzle migrations ────────────────────────────────────────────────────
info "Running Drizzle migrations..."
DIRECT_URL="$MIGRATION_URL" pnpm --filter @repo/database db:migrate

# ── Run Supabase migrations (if supabase CLI available) ───────────────────────
if command -v supabase &>/dev/null; then
  info "Pushing Supabase migration files..."
  supabase db push \
    --db-url "$MIGRATION_URL" \
    --include-all \
    2>&1 | sed 's/postgresql:\/\/[^@]*@/postgresql:\/\/***@/g'
else
  warn "supabase CLI not found. Skipping supabase db push."
  warn "Install: brew install supabase/tap/supabase"
fi

info "Staging migrations complete ✓"
