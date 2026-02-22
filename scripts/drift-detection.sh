#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Drift Detection Script — Cohortix Platform
# Weekly automated check for dependency, config, and architectural drift
# Reference: Axon Codex v1.2 §5.3 (Drift Prevention & Detection)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
DRIFT_COUNT=0
WARNING_COUNT=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Cohortix Platform — Drift Detection Report          ║${NC}"
echo -e "${BLUE}║        $(date '+%Y-%m-%d %H:%M:%S %Z')                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. DEPENDENCY DRIFT DETECTION
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}[1/5]${NC} Checking Dependency Drift..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for outdated dependencies
OUTDATED=$(pnpm outdated --format json 2>/dev/null || echo "[]")
OUTDATED_COUNT=$(echo "$OUTDATED" | jq 'length' 2>/dev/null || echo "0")

if [ "$OUTDATED_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $OUTDATED_COUNT outdated dependencies${NC}"
  echo "$OUTDATED" | jq -r '.[] | "  - \(.name): \(.current) → \(.latest) (wanted: \(.wanted))"' 2>/dev/null || true
  WARNING_COUNT=$((WARNING_COUNT + 1))
else
  echo -e "${GREEN}✅ All dependencies are up to date${NC}"
fi

# Check for security vulnerabilities
echo ""
echo "Running security audit..."
AUDIT_RESULT=$(pnpm audit --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"total":0}}}')
VULN_COUNT=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.total' 2>/dev/null || echo "0")

if [ "$VULN_COUNT" -gt 0 ]; then
  HIGH_VULN=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.high' 2>/dev/null || echo "0")
  CRITICAL_VULN=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.critical' 2>/dev/null || echo "0")
  
  if [ "$HIGH_VULN" -gt 0 ] || [ "$CRITICAL_VULN" -gt 0 ]; then
    echo -e "${RED}🚨 DRIFT DETECTED: $HIGH_VULN high + $CRITICAL_VULN critical vulnerabilities${NC}"
    DRIFT_COUNT=$((DRIFT_COUNT + 1))
  else
    echo -e "${YELLOW}⚠️  Found $VULN_COUNT low/moderate vulnerabilities${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
else
  echo -e "${GREEN}✅ No security vulnerabilities found${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. CONFIGURATION DRIFT DETECTION
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}[2/5]${NC} Checking Configuration Drift..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for .env drift (documented vs actual)
if [ -f ".env.example" ]; then
  EXAMPLE_KEYS=$(grep -v '^#' .env.example | grep -v '^$' | cut -d= -f1 | sort)
  
  if [ -f ".env.local" ]; then
    ACTUAL_KEYS=$(grep -v '^#' .env.local | grep -v '^$' | cut -d= -f1 | sort)
    MISSING_KEYS=$(comm -23 <(echo "$EXAMPLE_KEYS") <(echo "$ACTUAL_KEYS"))
    EXTRA_KEYS=$(comm -13 <(echo "$EXAMPLE_KEYS") <(echo "$ACTUAL_KEYS"))
    
    if [ -n "$MISSING_KEYS" ] || [ -n "$EXTRA_KEYS" ]; then
      echo -e "${YELLOW}⚠️  Environment variable drift detected${NC}"
      [ -n "$MISSING_KEYS" ] && echo "  Missing from .env.local: $(echo $MISSING_KEYS | tr '\n' ' ')"
      [ -n "$EXTRA_KEYS" ] && echo "  Extra in .env.local: $(echo $EXTRA_KEYS | tr '\n' ' ')"
      WARNING_COUNT=$((WARNING_COUNT + 1))
    else
      echo -e "${GREEN}✅ Environment configuration is aligned${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  No .env.local file found${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
else
  echo -e "${YELLOW}⚠️  No .env.example file found${NC}"
fi

# Check TypeScript config drift
if command -v jq &> /dev/null; then
  STRICT_MODE=$(jq -r '.compilerOptions.strict // empty' tsconfig.json 2>/dev/null)
  if [ "$STRICT_MODE" != "true" ]; then
    echo -e "${RED}🚨 DRIFT DETECTED: TypeScript strict mode is not enabled${NC}"
    DRIFT_COUNT=$((DRIFT_COUNT + 1))
  else
    echo -e "${GREEN}✅ TypeScript strict mode enabled${NC}"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. ARCHITECTURAL DRIFT DETECTION
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}[3/5]${NC} Checking Architectural Drift..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for undocumented API endpoints
if [ -d "apps/web/app/api" ]; then
  API_ROUTES=$(find apps/web/app/api -name "route.ts" -o -name "route.js" 2>/dev/null | wc -l)
  DOCUMENTED_ROUTES=$(grep -r "^###" docs/specs/API_DESIGN.md 2>/dev/null | wc -l)
  
  if [ "$API_ROUTES" -gt "$DOCUMENTED_ROUTES" ]; then
    echo -e "${YELLOW}⚠️  Possible API documentation drift: $API_ROUTES routes vs $DOCUMENTED_ROUTES documented${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  else
    echo -e "${GREEN}✅ API routes appear documented${NC}"
  fi
fi

# Check for component count growth
if [ -d "packages/ui/src/components" ]; then
  COMPONENT_COUNT=$(find packages/ui/src/components -name "*.tsx" 2>/dev/null | wc -l)
  echo "  Component count: $COMPONENT_COUNT"
  
  if [ "$COMPONENT_COUNT" -gt 100 ]; then
    echo -e "${YELLOW}⚠️  High component count may indicate need for consolidation${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
fi

# Check for large files (potential code smell)
LARGE_FILES=$(find apps packages -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 500 {print $2, $1}' | grep -v total || true)

if [ -n "$LARGE_FILES" ]; then
  echo -e "${YELLOW}⚠️  Files >500 lines (consider refactoring):${NC}"
  echo "$LARGE_FILES" | head -5
  WARNING_COUNT=$((WARNING_COUNT + 1))
else
  echo -e "${GREEN}✅ No excessively large files detected${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. DOCUMENTATION DRIFT DETECTION
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}[4/5]${NC} Checking Documentation Drift..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for outdated documentation (>90 days old)
STALE_DOCS=$(find docs -name "*.md" -mtime +90 2>/dev/null || true)

if [ -n "$STALE_DOCS" ]; then
  STALE_COUNT=$(echo "$STALE_DOCS" | wc -l)
  echo -e "${YELLOW}⚠️  $STALE_COUNT documentation files not updated in 90+ days${NC}"
  echo "$STALE_DOCS" | head -5 | sed 's/^/  - /'
  WARNING_COUNT=$((WARNING_COUNT + 1))
else
  echo -e "${GREEN}✅ Documentation appears current${NC}"
fi

# Check for undocumented packages
if [ -d "packages" ]; then
  for pkg in packages/*/; do
    if [ ! -f "${pkg}README.md" ]; then
      echo -e "${YELLOW}⚠️  Package $(basename $pkg) missing README.md${NC}"
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. TESTING DRIFT DETECTION
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}[5/5]${NC} Checking Testing Drift..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check test coverage
if [ -f "coverage/coverage-summary.json" ]; then
  COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
  COVERAGE_INT=${COVERAGE%.*}
  
  if [ "$COVERAGE_INT" -lt 80 ]; then
    echo -e "${RED}🚨 DRIFT DETECTED: Test coverage at ${COVERAGE}% (target: 80%+)${NC}"
    DRIFT_COUNT=$((DRIFT_COUNT + 1))
  else
    echo -e "${GREEN}✅ Test coverage at ${COVERAGE}% (target: 80%+)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No coverage report found (run 'pnpm test:coverage')${NC}"
  WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# Check for test files without assertions
TEST_FILES=$(find apps packages -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" 2>/dev/null || true)
if [ -n "$TEST_FILES" ]; then
  EMPTY_TESTS=$(echo "$TEST_FILES" | xargs grep -L "expect\|assert" 2>/dev/null || true)
  if [ -n "$EMPTY_TESTS" ]; then
    echo -e "${YELLOW}⚠️  Test files without assertions:${NC}"
    echo "$EMPTY_TESTS" | head -5 | sed 's/^/  - /'
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY & RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     DRIFT REPORT SUMMARY                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DRIFT_COUNT" -eq 0 ] && [ "$WARNING_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ No drift detected. Platform is healthy!${NC}"
  exit 0
elif [ "$DRIFT_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNING_COUNT warnings detected (no critical drift)${NC}"
  echo ""
  echo "Recommendations:"
  echo "  1. Review and address warnings before next sprint"
  echo "  2. Update documentation as needed"
  echo "  3. Schedule dependency updates"
  exit 0
else
  echo -e "${RED}🚨 CRITICAL DRIFT DETECTED${NC}"
  echo ""
  echo "  • Critical Issues: $DRIFT_COUNT"
  echo "  • Warnings: $WARNING_COUNT"
  echo ""
  echo "Immediate Actions Required:"
  echo "  1. Address all critical drift items before next deployment"
  echo "  2. Update security vulnerabilities immediately"
  echo "  3. Review and update configuration files"
  echo "  4. Restore test coverage to 80%+"
  echo ""
  echo "Escalate to: Platform Team & Guardian Agent"
  exit 1
fi
