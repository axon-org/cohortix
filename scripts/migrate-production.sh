#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# migrate-production.sh — Run Supabase migrations against the PRODUCTION database
# ─────────────────────────────────────────────────────────────────────────────
# ⚠️  DANGER ZONE — This touches live production data.
#
# Usage:
#   bash scripts/migrate-production.sh
#
# Requires:
#   - PRODUCTION_DIRECT_URL in environment OR .env.production.local file
#   - supabase CLI installed
#   - pnpm installed
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
BOLD='\033[1m'
info()  { echo -e "${GREEN}[prod-migrate]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }

# ── Load env ──────────────────────────────────────────────────────────────────
if [[ -f ".env.production.local" ]]; then
  info "Loading .env.production.local"
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env.production.local | xargs)
fi

# ── Validate required vars ────────────────────────────────────────────────────
if [[ -z "${PRODUCTION_DIRECT_URL:-}" ]] && [[ -z "${DIRECT_URL:-}" ]]; then
  error "PRODUCTION_DIRECT_URL (or DIRECT_URL) must be set."
  error "Export it or create .env.production.local with PRODUCTION_DIRECT_URL=postgresql://..."
  exit 1
fi

MIGRATION_URL="${PRODUCTION_DIRECT_URL:-$DIRECT_URL}"
MASKED_URL="postgresql://***@${MIGRATION_URL##*@}"

# ── SAFETY BANNER ─────────────────────────────────────────────────────────────
echo ""
echo -e "${RED}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║           ⚠️   PRODUCTION DATABASE MIGRATION   ⚠️           ║${NC}"
echo -e "${RED}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}  Target:  ${NC}${MASKED_URL}"
echo ""
echo -e "${YELLOW}  CHECKLIST (confirm each before proceeding):${NC}"
echo "  □  1. A Supabase backup has been triggered in the dashboard"
echo "  □  2. Migrations have been tested on staging first"
echo "  □  3. The deploy window has been confirmed with the team"
echo "  □  4. A rollback plan is documented and ready"
echo ""

read -r -p "Have you completed ALL checklist items above? (yes/no): " CHECK
if [[ "$CHECK" != "yes" ]]; then
  warn "Aborted. Complete the checklist before running production migrations."
  exit 1
fi

echo ""
warn "FINAL CONFIRMATION REQUIRED"
read -r -p "Type the full word 'PRODUCTION' to proceed: " CONFIRM
if [[ "$CONFIRM" != "PRODUCTION" ]]; then
  error "Aborted. You must type exactly: PRODUCTION"
  exit 1
fi

# ── Trigger Supabase backup reminder ─────────────────────────────────────────
echo ""
info "Starting migrations at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
info "Target: $MASKED_URL"
echo ""

# ── Run Drizzle migrations ────────────────────────────────────────────────────
info "Running Drizzle migrations..."
DIRECT_URL="$MIGRATION_URL" pnpm --filter @repo/database db:migrate
info "Drizzle migrations complete ✓"

# ── Run Supabase migrations (if supabase CLI available) ───────────────────────
if command -v supabase &>/dev/null; then
  info "Pushing Supabase migration files..."
  supabase db push \
    --db-url "$MIGRATION_URL" \
    --include-all \
    2>&1 | sed 's/postgresql:\/\/[^@]*@/postgresql:\/\/***@/g'
  info "Supabase migrations complete ✓"
else
  warn "supabase CLI not found. Skipping supabase db push."
  warn "Install: brew install supabase/tap/supabase"
fi

echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Production migrations complete at $(date -u '+%H:%M:%S UTC')${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
info "Post-migration: verify the app is healthy at https://app.cohortix.ai/api/health"
