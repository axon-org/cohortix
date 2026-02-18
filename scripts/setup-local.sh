#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-local.sh — Cohortix Local Development Bootstrap
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   bash scripts/setup-local.sh            # Standard setup (existing clone)
#   bash scripts/setup-local.sh --clone    # Clone repo then set up
#
# Requirements: node >= 20, pnpm >= 9, git
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[setup]${NC} $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
error()   { echo -e "${RED}[error]${NC} $*" >&2; }
step()    { echo -e "\n${GREEN}━━ $* ━━${NC}"; }

REPO_URL="https://github.com/ahmadashfq/cohortix.git"
CLONE_FLAG="${1:-}"

# ── Optional: clone repo ─────────────────────────────────────────────────────
if [[ "$CLONE_FLAG" == "--clone" ]]; then
  step "Cloning repository"
  git clone "$REPO_URL" cohortix
  cd cohortix
  info "Switched to: $(pwd)"
fi

# ── Verify we're in the right repo ───────────────────────────────────────────
if [[ ! -f "package.json" ]] || ! grep -q '"name": "cohortix"' package.json 2>/dev/null; then
  error "Run this script from the cohortix project root."
  exit 1
fi

step "Checking prerequisites"

# Node version
NODE_VER=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [[ -z "$NODE_VER" ]] || [[ "$NODE_VER" -lt 20 ]]; then
  error "Node.js >= 20 is required. Got: $(node --version 2>/dev/null || echo 'not found')"
  error "Install via: https://nodejs.org or use nvm/volta"
  exit 1
fi
info "Node.js: $(node --version) ✓"

# pnpm
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found. Installing via corepack..."
  corepack enable && corepack prepare pnpm@9 --activate
fi
PNPM_VER=$(pnpm --version 2>/dev/null | cut -d. -f1)
if [[ "$PNPM_VER" -lt 9 ]]; then
  error "pnpm >= 9 is required. Got: $(pnpm --version)"
  exit 1
fi
info "pnpm: $(pnpm --version) ✓"

# ── Checkout dev branch ───────────────────────────────────────────────────────
step "Git branch"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
info "Current branch: $CURRENT_BRANCH"
if [[ "$CURRENT_BRANCH" != "dev" ]] && [[ "$CURRENT_BRANCH" != feature/* ]]; then
  warn "You're not on 'dev' or a feature branch."
  warn "To switch: git checkout dev"
fi

# ── Install dependencies ──────────────────────────────────────────────────────
step "Installing dependencies"
pnpm install --frozen-lockfile
info "Dependencies installed ✓"

# ── Environment file ──────────────────────────────────────────────────────────
step "Environment setup"
if [[ -f ".env.local" ]]; then
  info ".env.local already exists — skipping copy."
  warn "Review it against .env.local.example to ensure it's complete."
else
  cp .env.local.example .env.local
  info "Created .env.local from template."
  warn "ACTION REQUIRED: Open .env.local and fill in your credentials."
  warn "  • Supabase URL, anon key, service role key"
  warn "  • Clerk publishable key and secret key"
  warn "  See docs/guides/LOCAL-SETUP.md for where to find each value."
fi

# ── Husky hooks ───────────────────────────────────────────────────────────────
step "Git hooks"
if [[ -d ".husky" ]]; then
  pnpm exec husky install 2>/dev/null || true
  info "Husky hooks installed ✓"
fi

# ── Verify build ─────────────────────────────────────────────────────────────
step "Verification"
info "Running type-check..."
pnpm type-check && info "Type check passed ✓" || warn "Type check had warnings — review output above."

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Cohortix local setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Next steps:"
echo "  1. Fill in .env.local (if you haven't already)"
echo "  2. pnpm dev          → start development server"
echo "  3. pnpm db:migrate   → apply database migrations"
echo "  4. pnpm db:seed      → seed local test data"
echo ""
echo "  Docs: docs/guides/LOCAL-SETUP.md"
echo ""
