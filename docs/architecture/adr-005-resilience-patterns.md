# ADR-005: Resilience Patterns for External Services

**Status:** Accepted  
**Date:** 2026-02-11  
**Author:** Devi (AI Developer)  
**Codex Compliance:** Section 2.4 (Resilience Engineering)

---

## Context

Cohortix relies on external services (primarily Supabase) for data persistence and authentication. Network failures, service outages, and transient errors are inevitable in distributed systems. Without proper resilience patterns, these failures can cascade and degrade user experience or cause complete service unavailability.

**Current Challenges:**
- Direct database calls without retry logic
- No protection against cascading failures
- Service outages cause immediate user-facing errors
- No graceful degradation strategy
- Transient network errors treated as permanent failures

**Requirements:**
- Implement retry logic with exponential backoff
- Add circuit breaker pattern to prevent cascading failures
- Maintain service availability during partial outages
- Provide graceful degradation where possible
- Follow Codex v1.2 Section 2.4 standards

---

## Decision

We will implement **resilience patterns** for all external service calls, specifically:

### 1. Retry Pattern with Exponential Backoff

**Implementation:** `lib/resilience.ts` - `withRetry()`

**Strategy:**
- Exponential backoff with jitter to prevent thundering herd
- Configurable retry attempts (default: 3)
- Intelligent retry decision based on error type
- Backoff multiplier: 2x (100ms → 200ms → 400ms)
- Maximum delay cap: 10 seconds

**Retryable Errors:**
- Network errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND)
- HTTP 503 Service Unavailable
- HTTP 504 Gateway Timeout
- Supabase transient errors

**Non-Retryable Errors:**
- 4xx client errors (Bad Request, Unauthorized, etc.)
- 500 Internal Server Error (may indicate code bug, not transient)
- Validation errors
- Business logic errors

**Example:**
```typescript
const user = await withRetry(
  () => supabase.from('users').select('*').eq('id', userId).single(),
  {
    maxRetries: 3,
    initialDelayMs: 100,
    backoffMultiplier: 2,
    useJitter: true,
  }
)
```

### 2. Circuit Breaker Pattern

**Implementation:** `lib/resilience.ts` - `CircuitBreaker` class

**States:**
- **CLOSED** (Normal): Requests flow normally
- **OPEN** (Tripped): Requests fail fast without calling service
- **HALF_OPEN** (Recovery): Limited requests test if service recovered

**Configuration:**
- Failure threshold: 5 consecutive failures → OPEN
- Reset timeout: 60 seconds before attempting HALF_OPEN
- Success threshold: 2 successful requests to close circuit
- Optional request timeout: 5 seconds

**State Transitions:**
```
CLOSED --[5 failures]--> OPEN
OPEN --[60s timeout]--> HALF_OPEN
HALF_OPEN --[2 successes]--> CLOSED
HALF_OPEN --[1 failure]--> OPEN
```

**Example:**
```typescript
const supabaseBreaker = new CircuitBreaker(
  async (userId: string) => {
    return supabase.from('users').select('*').eq('id', userId).single()
  },
  {
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    successThreshold: 2,
    requestTimeoutMs: 5000,
  }
)

const user = await supabaseBreaker.execute(userId)
```

### 3. Combined Resilient Call Pattern

**Implementation:** `lib/resilience.ts` - `withResilientCall()`

Combines retry + circuit breaker for maximum resilience:

```typescript
const fetchUser = withResilientCall(
  async (userId: string) => {
    return supabase.from('users').select('*').eq('id', userId).single()
  },
  {
    // Retry config
    maxRetries: 3,
    initialDelayMs: 100,
  },
  {
    // Circuit breaker config
    failureThreshold: 5,
    resetTimeoutMs: 60000,
  }
)

const user = await fetchUser(userId)
```

### 4. Timeout Strategy

All external service calls SHOULD have timeouts to prevent hung requests:

- **Read operations**: 5 seconds
- **Write operations**: 10 seconds
- **Batch operations**: 30 seconds

Timeouts are enforced at the circuit breaker level via `requestTimeoutMs` config.

---

## Consequences

### Positive

1. **Improved Availability:** System remains functional during transient failures
2. **Cascading Failure Prevention:** Circuit breaker stops overwhelming failing services
3. **Better UX:** Users see fewer error messages for transient issues
4. **Service Protection:** Prevents overwhelming external services during recovery
5. **Observability:** All failures logged with context for debugging
6. **Cost Efficiency:** Exponential backoff reduces unnecessary retry attempts
7. **Graceful Degradation:** Services can partially function during outages

### Negative

1. **Increased Latency:** Retries add latency to failed requests
2. **Complexity:** More code paths to test and maintain
3. **State Management:** Circuit breaker requires in-memory state (not suitable for serverless edge functions)
4. **False Positives:** Circuit may open during legitimate high-error scenarios
5. **Resource Usage:** Retry queues consume memory

### Mitigations

1. **Latency:** Configure aggressive timeouts to bound retry time
2. **Complexity:** Well-tested library code with clear examples
3. **State Management:** For edge functions, use retry only (stateless)
4. **False Positives:** Tune thresholds based on production metrics
5. **Resource Usage:** Cap max concurrent retry operations

---

## Implementation

### Phase 1: Core Infrastructure (✅ Completed)

- [x] Implement `withRetry()` function with exponential backoff
- [x] Implement `CircuitBreaker` class with state management
- [x] Implement `withResilientCall()` combined pattern
- [x] Add comprehensive logging for observability
- [x] Write unit tests for retry logic
- [x] Write unit tests for circuit breaker
- [x] Document in ADR-005

### Phase 2: Supabase Integration (📋 Planned)

- [ ] Wrap critical Supabase queries with retry logic
- [ ] Add circuit breakers for Supabase client instances
- [ ] Configure timeouts for all database operations
- [ ] Add monitoring for circuit breaker state changes
- [ ] Dashboard metrics for retry/failure rates

### Phase 3: Monitoring & Tuning (📋 Planned)

- [ ] Grafana dashboards for circuit breaker states
- [ ] Alerts for circuit breaker open events
- [ ] Metrics on retry success/failure rates
- [ ] A/B test different retry configurations
- [ ] Tune thresholds based on production data

---

## Usage Guidelines

### When to Use Retry

**DO use retry for:**
- ✅ Database read operations
- ✅ External API calls (weather, maps, etc.)
- ✅ File uploads to storage
- ✅ Cache lookups (Redis, Memcached)
- ✅ Message queue operations

**DON'T use retry for:**
- ❌ Non-idempotent writes without idempotency keys
- ❌ Payment processing (use idempotency instead)
- ❌ User authentication (security risk)
- ❌ Operations with side effects (emails, notifications)

### When to Use Circuit Breaker

**DO use circuit breaker for:**
- ✅ Calls to external services (Supabase, APIs)
- ✅ Operations that can cascade failures
- ✅ Services with known instability
- ✅ High-volume read paths

**DON'T use circuit breaker for:**
- ❌ Edge functions (stateless, no shared memory)
- ❌ Infrequent operations (<10 req/min)
- ❌ Operations that must always attempt (critical writes)

### Configuration Recommendations

**Critical Path (Auth, Payments):**
```typescript
{
  maxRetries: 2,
  initialDelayMs: 50,
  failureThreshold: 3,
  resetTimeoutMs: 30000,
}
```

**Standard Path (Dashboard Data):**
```typescript
{
  maxRetries: 3,
  initialDelayMs: 100,
  failureThreshold: 5,
  resetTimeoutMs: 60000,
}
```

**Background Jobs:**
```typescript
{
  maxRetries: 5,
  initialDelayMs: 1000,
  failureThreshold: 10,
  resetTimeoutMs: 300000,
}
```

---

## Monitoring & Alerting

### Key Metrics

1. **Retry Rate:** Percentage of requests that required retry
   - Target: <5%
   - Alert: >10%

2. **Circuit Breaker State:** Time spent in OPEN state
   - Target: <1% of time
   - Alert: Circuit open for >5 minutes

3. **Request Timeout Rate:** Percentage of requests that timed out
   - Target: <1%
   - Alert: >3%

4. **Retry Success Rate:** Percentage of retries that eventually succeeded
   - Target: >80%
   - Alert: <50%

### Alert Rules

**Critical:**
- Circuit breaker open for >5 minutes
- Retry rate >20% for >10 minutes
- All requests timing out

**Warning:**
- Circuit breaker state changes >3 times in 5 minutes
- Retry rate >10% for >5 minutes
- Timeout rate >5%

---

## Testing Strategy

### Unit Tests (✅ Completed)

- [x] Retry logic with various error types
- [x] Exponential backoff calculation
- [x] Jitter randomness
- [x] Circuit breaker state transitions
- [x] Timeout enforcement
- [x] Combined resilient call pattern

### Integration Tests (📋 Planned)

- [ ] Retry with actual Supabase calls
- [ ] Circuit breaker with simulated service failure
- [ ] Recovery after circuit opens
- [ ] Timeout with slow external services
- [ ] Concurrent requests with circuit breaker

### Load Tests (📋 Planned)

- [ ] Circuit breaker under sustained load
- [ ] Retry behavior under high error rate
- [ ] Recovery time after mass failures
- [ ] Resource usage (memory, CPU) under retry storm

---

## Alternative Approaches Considered

### 1. No Resilience Patterns (Rejected)

**Pros:**
- Simpler code
- Lower latency for successful requests

**Cons:**
- Poor user experience during outages
- Cascading failures
- Manual intervention required for recovery

**Verdict:** Rejected - unacceptable for production

### 2. Simple Fixed Retry (Rejected)

**Pros:**
- Easier to implement
- Predictable behavior

**Cons:**
- Can overwhelm services during recovery (thundering herd)
- Fixed delays not optimal for all scenarios
- No protection against cascading failures

**Verdict:** Rejected - insufficient for distributed systems

### 3. External Service (Resilience4j, Polly) (Rejected)

**Pros:**
- Battle-tested implementations
- Rich feature sets

**Cons:**
- Additional dependency
- Language-specific (JVM, .NET)
- Overkill for our current needs

**Verdict:** Rejected - prefer lightweight custom implementation

### 4. Cloud Provider Resilience (AWS SDK Retries) (Considered)

**Pros:**
- Built into SDKs
- Well-tuned for specific services

**Cons:**
- Not available for all services (Supabase)
- Less control over behavior
- Vendor lock-in

**Verdict:** Use where available, supplement with custom patterns

---

## Future Enhancements

1. **Distributed Circuit Breaker:** Use Redis for shared state across instances
2. **Adaptive Retry:** ML-based retry strategy tuning
3. **Bulkhead Pattern:** Isolate failure domains
4. **Rate Limiting Integration:** Coordinate with rate limiters
5. **Fallback Strategies:** Cache-based graceful degradation
6. **Health Checks:** Active health probes for circuit breaker decisions

---

## References

- [Codex v1.2 Section 2.4: Resilience Engineering](~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md#24-resilience-engineering)
- [Microsoft: Retry Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/retry)
- [Microsoft: Circuit Breaker Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [AWS: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Release It! - Michael T. Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/)
- [Site Reliability Engineering - Google](https://sre.google/sre-book/handling-overload/)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-11 | Implement retry with exponential backoff | Industry best practice for transient failures |
| 2026-02-11 | Implement circuit breaker pattern | Prevent cascading failures per Codex |
| 2026-02-11 | Use in-memory state for circuit breaker | Sufficient for current scale, can upgrade to Redis later |
| 2026-02-11 | Default timeout 5s for reads, 10s for writes | Balanced between UX and service protection |
| 2026-02-11 | Jitter enabled by default | Prevents thundering herd |

---

**Status:** ✅ **Infrastructure Complete** | 📋 **Integration Planned**  
**Next Review:** 2026-03-11 (30 days)  
**Owner:** Backend Team (Devi)
