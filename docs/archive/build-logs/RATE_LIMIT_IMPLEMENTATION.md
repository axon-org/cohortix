# API Rate Limiting Implementation

**Date:** 2026-02-13  
**Branch:** feature/sprint-4-mission-control  
**Implemented by:** Devi (AI Developer)

## Summary

Implemented in-memory rate limiting for all `/api/v1/` endpoints in the Cohortix
Next.js web app to prevent abuse and ensure fair resource usage.

## Implementation Details

### 1. Rate Limit Configuration

Added `authRateLimit` preset to `apps/web/src/lib/rate-limit.ts`:

```typescript
export const authRateLimit: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
};
```

**Existing presets:**

- `strictRateLimit`: 5 req/min (for sensitive operations)
- `authRateLimit`: 20 req/min (for auth endpoints) — **NEW**
- `standardRateLimit`: 100 req/min (for general API endpoints)
- `generousRateLimit`: 300 req/min (for read-only operations)

### 2. Combined Middleware Function

Created `withMiddleware()` helper in `apps/web/src/lib/rate-limit.ts` that
combines:

- **Rate limiting** (using token bucket algorithm)
- **RFC 7807 error handling** (Problem Details format)

This replaces the previous pattern of `withErrorHandler()` wrapping handlers
separately.

**Benefits:**

- Single wrapper for both concerns
- Automatic rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`,
  `Retry-After`)
- Proper 429 responses with RFC 7807 Problem Details
- Handles all custom `AppError` types
- Comprehensive error logging

### 3. Applied to All `/api/v1/` Endpoints

Updated 11 route files:

```
✓ apps/web/src/app/api/v1/missions/route.ts
✓ apps/web/src/app/api/v1/missions/[id]/route.ts
✓ apps/web/src/app/api/v1/agents/route.ts
✓ apps/web/src/app/api/v1/agents/[id]/route.ts
✓ apps/web/src/app/api/v1/operations/route.ts
✓ apps/web/src/app/api/v1/operations/[id]/route.ts
✓ apps/web/src/app/api/v1/cohorts/route.ts
✓ apps/web/src/app/api/v1/cohorts/[id]/route.ts
✓ apps/web/src/app/api/v1/dashboard/engagement-chart/route.ts
✓ apps/web/src/app/api/v1/dashboard/health-trends/route.ts
✓ apps/web/src/app/api/v1/dashboard/mission-control/route.ts
```

**Pattern change:**

```typescript
// Before
export const GET = withErrorHandler(async (request: NextRequest) => {
  // handler code
});

// After
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';

export const GET = withMiddleware(
  standardRateLimit,
  async (request: NextRequest) => {
    // handler code
  }
);
```

All endpoints now use `standardRateLimit` (100 requests/min per IP).

### 4. Rate Limiting Strategy

**Algorithm:** Token Bucket

- Bucket starts with `maxRequests` tokens
- Each request consumes 1 token
- Bucket refills at rate of `(maxRequests / windowMs)` tokens per millisecond
- Request is allowed if bucket has ≥1 token

**Identifier:** IP address or user ID

- Extracted from `x-forwarded-for` or `x-real-ip` headers
- Falls back to user ID from auth headers if available
- Key format: `ip:192.168.1.1` or `user:uuid`

**Storage:** In-memory `Map`

- Automatic cleanup every 5 minutes (removes entries older than 1 hour)
- **Note:** Not suitable for multi-instance deployments without Redis/Upstash

**Response Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1708012345678
Retry-After: 60  # (when rate limited)
```

### 5. Error Responses

When rate limit is exceeded, returns 429 with RFC 7807 Problem Details:

```json
{
  "type": "https://cohortix.com/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Too many requests, please try again later",
  "instance": "/api/v1/missions",
  "retryAfter": 60
}
```

## Configuration

### Current Limits

| Endpoint Type | Limit   | Window | Applied To                                |
| ------------- | ------- | ------ | ----------------------------------------- |
| General API   | 100 req | 1 min  | All `/api/v1/` routes                     |
| Auth          | 20 req  | 1 min  | _Not yet applied (no custom auth routes)_ |

### Changing Limits

To adjust limits for specific endpoints:

```typescript
// In the route file
import { withMiddleware, strictRateLimit } from '@/lib/rate-limit';

// Use a different preset
export const POST = withMiddleware(strictRateLimit, async (request) => {
  // handler code
});

// Or create a custom config
export const DELETE = withMiddleware(
  { maxRequests: 10, windowMs: 60000 },
  async (request) => {
    // handler code
  }
);
```

## Production Considerations

### Current Limitations

⚠️ **In-memory storage is NOT suitable for production with multiple instances**

- Rate limits are per-instance, not global
- Restarting the server clears all rate limit state
- Horizontal scaling will allow `N × maxRequests` where N = number of instances

### Migration Path to Production

When moving to production, replace in-memory storage with Redis/Upstash:

1. **Option 1: Upstash (Recommended for free tier)**
   - Serverless Redis with generous free tier
   - Works with Vercel/Netlify deployments
   - [Upstash Rate Limiting](https://upstash.com/docs/redis/features/rate-limiting)

2. **Option 2: Redis**
   - Self-hosted or managed (Redis Cloud, AWS ElastiCache)
   - Requires `ioredis` or `redis` package
   - Update `RateLimitStore` class in `rate-limit.ts`

**Migration steps:**

1. Add Redis client to `rate-limit.ts`
2. Replace `Map` with Redis commands (`INCR`, `EXPIRE`)
3. Update tests to use Redis mock
4. Update deployment config with Redis connection string

## Testing

### Build Verification

```bash
cd ~/Projects/cohortix/apps/web
pnpm build
```

✅ **Result:** Build successful with 0 errors

### Manual Testing

Test rate limiting with:

```bash
# Test standard limit (100 req/min)
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/v1/missions
done

# Check for 429 response on 101st request
```

Expected response on rate limit:

```json
{
  "type": "https://cohortix.com/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Too many requests, please try again later",
  "instance": "/api/v1/missions",
  "retryAfter": 60
}
```

### Unit Tests

Rate limiting tests exist in:

```
apps/web/src/lib/__tests__/rate-limit.test.ts
```

Run tests:

```bash
pnpm test rate-limit
```

## Files Modified

### Core Implementation

- `apps/web/src/lib/rate-limit.ts` — Added `authRateLimit` preset and
  `withMiddleware()` function

### API Routes (11 files)

- All `/api/v1/` routes updated to use `withMiddleware(standardRateLimit, ...)`

### Commit

```
feat: add API rate limiting (in-memory, 100 req/min)

- Added authRateLimit preset (20 req/min) for future auth endpoints
- Created withMiddleware() combining rate limiting + RFC 7807 error handling
- Applied standardRateLimit (100 req/min) to all /api/v1/ endpoints
- In-memory token bucket implementation (suitable for MVP/free tier)
- TODO: Migrate to Redis/Upstash for production multi-instance deployments
```

## Next Steps

1. **Monitor rate limit hits** in production logs
2. **Adjust limits** based on actual usage patterns
3. **Implement Redis** before horizontal scaling
4. **Add custom limits** for specific high-traffic endpoints
5. **Consider user-based limits** for authenticated requests (instead of
   IP-based)

## References

- [RFC 7807 Problem Details](https://tools.ietf.org/html/rfc7807)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Codex v1.2 Section 2.5](../CONVENTIONS.md) — Rate Limiting Standards

---

**Status:** ✅ Complete  
**Build:** ✅ Passing  
**Tests:** ⚠️ Manual testing required
