# Observability Baseline — Logging & Metrics Standards

**Date:** 2026-02-11  
**Author:** Guardian (Hafiz)  
**Codex Reference:** Axon Codex v1.2 §2.7 (Observability)

---

## Overview

This document defines the **minimum viable observability** for Cohortix,
following Codex standards for structured logging, RED metrics, and distributed
tracing.

**Three Pillars of Observability:**

1. **Logs** — What happened (events, errors, state changes)
2. **Metrics** — How much/how often (throughput, latency, errors)
3. **Traces** — Where time was spent (request flow across services)

**Philosophy:** Start simple (logs + basic metrics), add complexity as the
system grows.

---

## 1. Structured Logging Standards

### 1.1 Log Format (JSON)

**All logs MUST be structured JSON** for machine readability and aggregation.

**Standard Log Structure:**

```json
{
  "timestamp": "2026-02-11T15:30:45.123Z",
  "level": "info",
  "message": "User created cohort",
  "service": "web",
  "environment": "production",
  "correlation_id": "req_abc123",
  "user_id": "usr_456def",
  "organization_id": "org_789ghi",
  "context": {
    "cohort_id": "coh_xyz",
    "cohort_name": "Marketing Team Q1",
    "action": "cohort.created"
  },
  "performance": {
    "duration_ms": 145
  }
}
```

**Required Fields (Every Log Entry):**

| Field            | Type     | Description            | Example                                   |
| ---------------- | -------- | ---------------------- | ----------------------------------------- |
| `timestamp`      | ISO 8601 | When event occurred    | `2026-02-11T15:30:45.123Z`                |
| `level`          | enum     | Log severity           | `debug`, `info`, `warn`, `error`, `fatal` |
| `message`        | string   | Human-readable summary | `"User created cohort"`                   |
| `service`        | string   | Service name           | `web`, `api`, `worker`                    |
| `environment`    | enum     | Deployment env         | `development`, `staging`, `production`    |
| `correlation_id` | string   | Request trace ID       | `req_abc123`                              |

**Contextual Fields (When Applicable):**

| Field             | Type   | Description                                |
| ----------------- | ------ | ------------------------------------------ |
| `user_id`         | string | Authenticated user ID                      |
| `organization_id` | string | Tenant/organization ID                     |
| `session_id`      | string | User session ID                            |
| `ip_address`      | string | Client IP (for security logs only)         |
| `user_agent`      | string | Client user agent (for security logs only) |
| `context`         | object | Event-specific metadata                    |
| `performance`     | object | Timing information                         |
| `error`           | object | Error details (if `level=error`)           |

---

### 1.2 Log Levels

| Level     | Use Case                           | Examples                                            |
| --------- | ---------------------------------- | --------------------------------------------------- |
| **DEBUG** | Development troubleshooting        | Variable values, function entry/exit                |
| **INFO**  | Normal business events             | User login, cohort created, data synced             |
| **WARN**  | Recoverable errors, degraded state | Retry attempt, slow query, deprecated API used      |
| **ERROR** | Errors requiring attention         | API call failed, validation error, database timeout |
| **FATAL** | System-level failures              | Service crash, critical dependency unavailable      |

**Production Log Level:** `INFO` (hide DEBUG logs)

**Sensitive Data Rules:**

- ❌ **NEVER log:** Passwords, API keys, credit cards, tokens
- ⚠️ **Hash/redact:** Email addresses, IP addresses (GDPR)
- ✅ **Safe to log:** User IDs, timestamps, non-PII metadata

---

### 1.3 Correlation IDs (Request Tracing)

**Every HTTP request MUST have a unique correlation ID** to trace its flow
through the system.

**Generation:**

```typescript
// middleware.ts (Next.js)
import { v4 as uuidv4 } from 'uuid';

export async function middleware(request: NextRequest) {
  const correlationId =
    request.headers.get('x-correlation-id') || `req_${uuidv4()}`;

  // Attach to request context
  request.headers.set('x-correlation-id', correlationId);

  // Log request
  logger.info('HTTP request received', {
    correlation_id: correlationId,
    method: request.method,
    path: request.nextUrl.pathname,
    user_agent: request.headers.get('user-agent'),
  });

  const response = NextResponse.next({ request });
  response.headers.set('x-correlation-id', correlationId);

  return response;
}
```

**Propagation:**

- Frontend → Backend: `x-correlation-id` header
- Backend → Database: Include in query comments
- Backend → External APIs: Forward in headers

**Usage:**

```bash
# Find all logs for a specific request
grep "req_abc123" logs/app.log
```

---

### 1.4 Logger Implementation

**Recommended Library:** [Pino](https://getpino.io/) (fast, JSON-native, low
overhead)

**Setup:**

```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: process.env.SERVICE_NAME || 'web',
    environment: process.env.NODE_ENV || 'development',
  },
  redact: {
    paths: [
      'password',
      'token',
      'api_key',
      'authorization',
      'cookie',
      '*.password',
      '*.token',
    ],
    remove: true,
  },
});

export default logger;
```

**Usage:**

```typescript
import logger from '@/lib/logger';

// Info log
logger.info({
  message: 'User created cohort',
  correlation_id: req.headers.get('x-correlation-id'),
  user_id: user.id,
  organization_id: org.id,
  context: {
    cohort_id: cohort.id,
    cohort_name: cohort.name,
  },
});

// Error log
logger.error({
  message: 'Failed to create cohort',
  correlation_id: req.headers.get('x-correlation-id'),
  user_id: user.id,
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
  },
});
```

---

### 1.5 Key Events to Log

**User Actions:**

- User login/logout
- Cohort created/updated/deleted
- Dashboard viewed
- Agent action triggered
- Export data requested

**System Events:**

- API request received
- Database query executed (if >100ms)
- External API call made
- Cache hit/miss
- Background job started/completed/failed

**Security Events:**

- Authentication attempt (success/failure)
- Authorization denial
- Suspicious activity (rate limit hit, invalid token)
- Data export (audit trail)

**Performance Events:**

- Slow query (>1s)
- High memory usage
- Circuit breaker opened
- Retry triggered

---

## 2. Metrics Standards (RED Method)

### 2.1 RED Metrics Overview

**RED = Rate + Errors + Duration** (minimum metrics for every service)

| Metric       | What It Measures        | Target             |
| ------------ | ----------------------- | ------------------ |
| **Rate**     | Requests per second     | Baseline: <100 RPS |
| **Errors**   | Error rate (%)          | <1% error rate     |
| **Duration** | Latency (p50, p95, p99) | p95 <500ms         |

**Why RED?**

- Simple to implement
- Covers core reliability indicators
- Aligns with SRE best practices

---

### 2.2 Metric Implementation

**Recommended Tool:** [Prometheus](https://prometheus.io/) (industry standard)

**Alternative (Simpler):** Application-level logging + log aggregation (e.g.,
Vercel Analytics, DataDog)

**Metric Types:**

| Type          | Use Case                                   | Example                          |
| ------------- | ------------------------------------------ | -------------------------------- |
| **Counter**   | Monotonicagent increasing values            | Total requests, total errors     |
| **Gauge**     | Current value (can go up/down)             | Active users, memory usage       |
| **Histogram** | Distribution of values                     | Request duration (p50, p95, p99) |
| **Summary**   | Like histogram, but aggregated client-side | (Less common)                    |

---

### 2.3 Standard Metrics to Track

**HTTP Request Metrics:**

```typescript
// Pseudo-code (Prometheus client)
import { Counter, Histogram } from 'prom-client';

// Rate: Total requests
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Errors: Failed requests
const httpRequestsErrors = new Counter({
  name: 'http_requests_errors_total',
  help: 'Total HTTP errors (5xx)',
  labelNames: ['method', 'route', 'status_code'],
});

// Duration: Request latency
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Usage in middleware
export async function middleware(request: NextRequest) {
  const start = Date.now();
  const response = await handleRequest(request);
  const duration = (Date.now() - start) / 1000;

  // Increment counters
  httpRequestsTotal.inc({
    method: request.method,
    route: request.nextUrl.pathname,
    status_code: response.status,
  });

  if (response.status >= 500) {
    httpRequestsErrors.inc({
      method: request.method,
      route: request.nextUrl.pathname,
      status_code: response.status,
    });
  }

  // Record duration
  httpRequestDuration.observe(
    {
      method: request.method,
      route: request.nextUrl.pathname,
      status_code: response.status,
    },
    duration
  );

  return response;
}
```

**Database Metrics:**

```typescript
const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total database queries',
  labelNames: ['operation', 'table'],
});

const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});
```

**Business Metrics:**

```typescript
const cohortsCreatedTotal = new Counter({
  name: 'cohorts_created_total',
  help: 'Total cohorts created',
  labelNames: ['organization_id'],
});

const activeUsersGauge = new Gauge({
  name: 'active_users',
  help: 'Currently active users',
});
```

---

### 2.4 Metric Labels (Dimensions)

**Common Labels:**

| Label             | Purpose        | Example Values                   |
| ----------------- | -------------- | -------------------------------- |
| `method`          | HTTP method    | `GET`, `POST`, `PUT`, `DELETE`   |
| `route`           | API route      | `/api/cohorts`, `/api/dashboard` |
| `status_code`     | HTTP status    | `200`, `400`, `500`              |
| `organization_id` | Tenant ID      | `org_123`                        |
| `environment`     | Deployment env | `production`, `staging`          |

**Label Cardinality Warning:**

- ⚠️ **Keep label cardinality low** (<1000 unique combinations)
- ❌ **DO NOT use high-cardinality labels:** User ID, correlation ID, timestamps
- ✅ **DO use low-cardinality labels:** Route, status code, org ID

---

### 2.5 Alerting Thresholds

**Critical Alerts (Immediate Action Required):**

| Alert                    | Condition                              | Action                |
| ------------------------ | -------------------------------------- | --------------------- |
| **High Error Rate**      | Error rate >5% for 5 minutes           | Page on-call engineer |
| **API Down**             | No successful requests for 2 minutes   | Page on-call engineer |
| **Database Unavailable** | DB connection failures >10 in 1 minute | Page on-call engineer |

**Warning Alerts (Investigation Required):**

| Alert                   | Condition                     | Action             |
| ----------------------- | ----------------------------- | ------------------ |
| **Elevated Error Rate** | Error rate >1% for 10 minutes | Slack notification |
| **Slow API**            | p95 latency >1s for 5 minutes | Slack notification |
| **High Memory Usage**   | >80% memory for 5 minutes     | Slack notification |

**Informational (Monitoring Only):**

| Alert             | Condition            | Action           |
| ----------------- | -------------------- | ---------------- |
| **Traffic Spike** | Traffic >2x baseline | Log to dashboard |
| **Slow Query**    | Query >2s            | Log to dashboard |

---

## 3. Distributed Tracing (Future)

**Not implemented in Week 2, but documented for future reference.**

**When to Add Tracing:**

- When you have multiple services (microservices)
- When debugging cross-service latency issues
- When request flow is complex (API → Queue → Worker)

**Recommended Tool:** OpenTelemetry + Jaeger (or Tempo)

**What Tracing Provides:**

- Visualize request flow across services
- Identify bottlenecks (which service is slow?)
- Measure service dependencies

**Example Trace:**

```
Request ID: req_abc123
├── [API Gateway] 150ms
│   ├── [Auth Service] 20ms
│   └── [Database] 80ms
└── [External API] 50ms
```

---

## 4. Implementation Checklist

### Week 2 (Current Sprint) — Observability Baseline

- [x] Document structured logging standards
- [x] Define RED metrics standards
- [ ] Implement Pino logger with correlation IDs
- [ ] Add HTTP request logging to middleware
- [ ] Create logging utility functions
- [ ] Test log output format
- [ ] Document log aggregation strategy (future)

### Week 3 — Metrics Implementation

- [ ] Set up Prometheus client (or equivalent)
- [ ] Instrument HTTP requests (Rate, Errors, Duration)
- [ ] Instrument database queries
- [ ] Create Grafana dashboard (if using Prometheus)
- [ ] Set up basic alerting (email/Slack)

### Month 2 — Advanced Observability

- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Implement custom business metrics
- [ ] Set up log aggregation (e.g., ELK, Loki)
- [ ] Create runbooks for common alerts

---

## 5. Monitoring Dashboard (Grafana Example)

**Dashboard Panels:**

**1. Traffic Overview**

- Total requests per second (line chart)
- Requests by route (bar chart)
- Requests by status code (stacked area)

**2. Error Tracking**

- Error rate % (line chart)
- Errors by route (table)
- Recent errors (log stream)

**3. Performance**

- p50, p95, p99 latency (line chart)
- Slow queries >1s (table)
- Database connection pool usage (gauge)

**4. Business Metrics**

- Cohorts created per day (bar chart)
- Active users (gauge)
- Data export events (counter)

---

## 6. Log Aggregation Strategy

**Current State:** Logs to stdout (Vercel captures automaticagent)

**Short-Term (Month 1-2):**

- Use Vercel's built-in log aggregation
- Query logs via Vercel CLI: `vercel logs <deployment-url>`
- Filter by correlation ID: `vercel logs --grep req_abc123`

**Mid-Term (Month 3-6):**

- Integrate with log aggregation service:
  - **Option A:** DataDog (expensive, comprehensive)
  - **Option B:** Better Stack (formerly Logtail, mid-tier)
  - **Option C:** Self-hosted Loki + Grafana (free, requires ops)

**Long-Term (Month 6+):**

- Full observability stack:
  - Logs: Loki or Elasticsearch
  - Metrics: Prometheus
  - Traces: Tempo or Jaeger
  - Visualization: Grafana

---

## 7. Success Metrics

| Metric                                    | Target             | Current | Status         |
| ----------------------------------------- | ------------------ | ------- | -------------- |
| **Log coverage (% of endpoints logging)** | 100%               | TBD     | 🔍 To Measure  |
| **Mean time to detect (MTTD) incidents**  | <5 minutes         | TBD     | 🔍 To Measure  |
| **Logs are structured JSON**              | 100%               | TBD     | ⏳ In Progress |
| **Correlation ID in all logs**            | 100%               | TBD     | ⏳ In Progress |
| **RED metrics tracked**                   | 100% of API routes | 0%      | ⏳ Not Started |

---

## 8. Example: Complete Logging Implementation

**File: `lib/logger.ts`**

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: process.env.SERVICE_NAME || 'web',
    environment: process.env.NODE_ENV || 'development',
  },
  redact: {
    paths: ['password', 'token', 'api_key', 'authorization', 'cookie'],
    remove: true,
  },
});

export function logRequest(req: Request, res: Response, duration: number) {
  logger.info({
    message: 'HTTP request',
    correlation_id: req.headers.get('x-correlation-id'),
    method: req.method,
    path: req.url,
    status_code: res.status,
    performance: { duration_ms: duration },
    user_id: req.user?.id,
    organization_id: req.organization?.id,
  });
}

export function logError(error: Error, context: Record<string, unknown>) {
  logger.error({
    message: error.message,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
}

export default logger;
```

**File: `middleware.ts`**

```typescript
import { v4 as uuidv4 } from 'uuid';
import { logRequest } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  const start = Date.now();
  const correlationId =
    request.headers.get('x-correlation-id') || `req_${uuidv4()}`;

  request.headers.set('x-correlation-id', correlationId);

  const response = NextResponse.next({ request });
  response.headers.set('x-correlation-id', correlationId);

  const duration = Date.now() - start;
  logRequest(request, response, duration);

  return response;
}
```

---

## References

- **Axon Codex v1.2 §2.7:** Observability
- **RED Method:**
  https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/
- **Pino Documentation:** https://getpino.io/
- **Prometheus Best Practices:** https://prometheus.io/docs/practices/naming/
- **OpenTelemetry:** https://opentelemetry.io/

---

_Document maintained by: Guardian (Hafiz)_  
_Next review: 2026-03-01 (Monthly observability review)_
