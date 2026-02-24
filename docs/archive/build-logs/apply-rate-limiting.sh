#!/bin/bash

# Apply rate limiting to all /api/v1/ routes

ROUTES=(
  "apps/web/src/app/api/v1/agents/route.ts"
  "apps/web/src/app/api/v1/agents/[id]/route.ts"
  "apps/web/src/app/api/v1/operations/route.ts"
  "apps/web/src/app/api/v1/operations/[id]/route.ts"
  "apps/web/src/app/api/v1/cohorts/route.ts"
  "apps/web/src/app/api/v1/cohorts/[id]/route.ts"
  "apps/web/src/app/api/v1/dashboard/engagement-chart/route.ts"
  "apps/web/src/app/api/v1/dashboard/health-trends/route.ts"
  "apps/web/src/app/api/v1/dashboard/mission-control/route.ts"
)

for route in "${ROUTES[@]}"; do
  if [ -f "$route" ]; then
    echo "Processing: $route"
    
    # Add import if not present
    if ! grep -q "import.*withRateLimit.*from '@/lib/rate-limit'" "$route"; then
      # Find the line with withErrorHandler import
      if grep -q "import.*withErrorHandler" "$route"; then
        # Add after withErrorHandler import line
        sed -i.bak '/import.*withErrorHandler/a\
import { withRateLimit, standardRateLimit } from '\''@/lib/rate-limit'\''
' "$route"
        rm "${route}.bak"
        echo "  ✓ Added rate-limit import"
      fi
    fi
  fi
done

echo "Done! Now manually wrap handlers with withRateLimit(standardRateLimit, ...)"
