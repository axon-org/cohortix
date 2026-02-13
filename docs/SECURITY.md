# Agent Command Center — Security Architecture

> Comprehensive security design for enterprise-grade multi-tenant SaaS

*Version: 1.0.0 | Last Updated: 2026-02-05*

---

## Overview

Security is foundational to Agent Command Center. This document covers:

- Authentication & Authorization
- Multi-tenant Data Isolation
- API Security
- Data Protection
- Audit & Compliance

---

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum access required for operations
3. **Zero Trust**: Verify every request, trust nothing
4. **Secure by Default**: Security enabled out of the box
5. **Fail Secure**: Deny access on error conditions

---

## Authentication Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────┘

  ┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────┐
  │ Browser │────▶│  Supabase   │────▶│   Next.js    │────▶│   API   │
  │         │     │    Auth     │     │  Middleware  │     │ Routes  │
  └─────────┘     └─────────────┘     └──────────────┘     └─────────┘
       │                │                    │                  │
       │  1. Sign In    │                    │                  │
       │  (email/OAuth) │                    │                  │
       │───────────────▶│                    │                  │
       │                │                    │                  │
       │  2. MFA (TOTP  │                    │                  │
       │     if enabled)│                    │                  │
       │◀──────────────▶│                    │                  │
       │                │                    │                  │
       │  3. JWT +      │                    │                  │
       │     Session    │                    │                  │
       │◀───────────────│                    │                  │
       │                │                    │                  │
       │  4. Request with JWT (httpOnly cookie)                │
       │─────────────────────────────────────▶│                  │
       │                │                    │                  │
       │                │  5. Verify JWT     │                  │
       │                │     via JWKS       │                  │
       │                │◀───────────────────│                  │
       │                │                    │                  │
       │                │  6. JWT Valid +    │                  │
       │                │     User Claims    │                  │
       │                │───────────────────▶│                  │
       │                │                    │                  │
       │                │                    │  7. RLS active   │
       │                │                    │     (auth.uid()) │
       │                │                    │─────────────────▶│
       │                │                    │                  │
       │  8. Response (filtered by RLS)      │                  │
       │◀─────────────────────────────────────────────────────────│
```

### Supabase Auth Configuration

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if needed
  await supabase.auth.getSession();

  // Protect dashboard routes
  const { data: { session } } = await supabase.auth.getSession();
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Session Management

| Setting | Value | Rationale |
|---------|-------|-----------|
| Session Duration | 7 days | Balance security/UX |
| Token Refresh | Rolling (on activity) | Keep active users logged in |
| Inactivity Timeout | 30 minutes | Protect unattended sessions |
| Single Session | Optional (per org) | Enterprise requirement |
| MFA | Optional (encouraged) | Added security layer |

### Multi-Factor Authentication

Supabase Auth provides MFA support:

- **TOTP**: Authenticator apps (Google Authenticator, Authy, 1Password)
- **QR Code Enrollment**: Easy setup via QR code scanning
- **Recovery Codes**: Backup codes for account recovery

**Implementation:**
```typescript
// Enroll MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Work Phone',
});

// Challenge MFA
const { data, error } = await supabase.auth.mfa.challenge({
  factorId: data.id,
});

// Verify MFA code
const { data, error } = await supabase.auth.mfa.verify({
  factorId: data.id,
  challengeId: challenge.id,
  code: '123456', // User-provided code
});
```

**Enforcement Levels:**
- Free tier: Optional
- Pro tier: Encouraged for admins
- Enterprise: Required for all users via RLS policies

---

## Authorization (RBAC)

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ROLE HIERARCHY                                 │
└─────────────────────────────────────────────────────────────────────┘

  Platform Level                    Organization Level
  ─────────────                     ─────────────────

  ┌─────────────┐                   ┌─────────────┐
  │   Platform  │                   │    Owner    │
  │    Admin    │                   │ (Full control)
  └─────────────┘                   └──────┬──────┘
        │                                  │
        │                                  │
        ▼                           ┌──────▼──────┐
  ┌─────────────┐                   │    Admin    │
  │  Support    │                   │ (Manage users,
  │  (Read-only │                   │  settings)   │
  │   + impersonate)                └──────┬──────┘
  └─────────────┘                          │
                                    ┌──────▼──────┐
                                    │   Member    │
                                    │ (Full mission
                                    │  access)     │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │   Viewer    │
                                    │ (Read-only) │
                                    └─────────────┘
```

### Permission Matrix

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| View missions | ✅ | ✅ | ✅ | ✅ |
| Create missions | ✅ | ✅ | ✅ | ❌ |
| Delete missions | ✅ | ✅ | ❌ | ❌ |
| View actions | ✅ | ✅ | ✅ | ✅ |
| Create/edit actions | ✅ | ✅ | ✅ | ❌ |
| Delete actions | ✅ | ✅ | ✅ | ❌ |
| Manage agents | ✅ | ✅ | ❌ | ❌ |
| View knowledge | ✅ | ✅ | ✅ | ✅ |
| Add knowledge | ✅ | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Manage integrations | ✅ | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |
| API key management | ✅ | ✅ | ❌ | ❌ |

### Authorization Implementation

```typescript
// lib/auth/permissions.ts
export type Permission =
  | 'missions:read'
  | 'missions:create'
  | 'missions:update'
  | 'missions:delete'
  | 'actions:read'
  | 'actions:create'
  | 'actions:update'
  | 'actions:delete'
  | 'agents:read'
  | 'agents:manage'
  | 'knowledge:read'
  | 'knowledge:create'
  | 'members:invite'
  | 'members:remove'
  | 'settings:manage'
  | 'billing:manage'
  | 'audit:read';

export const rolePermissions: Record<OrgRole, Permission[]> = {
  owner: ['*'], // All permissions
  admin: [
    'missions:*',
    'actions:*',
    'agents:*',
    'knowledge:*',
    'members:invite',
    'members:remove',
    'settings:manage',
    'audit:read',
  ],
  member: [
    'missions:read',
    'missions:create',
    'missions:update',
    'actions:*',
    'knowledge:read',
    'knowledge:create',
  ],
  viewer: [
    'missions:read',
    'actions:read',
    'knowledge:read',
  ],
};

// Check permission
export function hasPermission(
  userRole: OrgRole,
  permission: Permission
): boolean {
  const permissions = rolePermissions[userRole];
  if (permissions.includes('*')) return true;
  
  const [resource, action] = permission.split(':');
  return (
    permissions.includes(permission) ||
    permissions.includes(`${resource}:*`)
  );
}
```

### Authorization Middleware

```typescript
// lib/auth/authorize.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hasPermission, Permission } from './permissions';

export async function requirePermission(permission: Permission) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Get user's org membership and role
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    throw new ForbiddenError('Not a member of any organization');
  }

  if (!hasPermission(membership.role, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }

  return {
    userId: user.id,
    orgId: membership.organization_id,
    orgRole: membership.role,
  };
}

// Usage in API route
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const { orgId } = await requirePermission('missions:delete');
  
  // Delete mission (RLS will ensure it belongs to orgId)
  const supabase = createServerClient(/* ... */);
  await supabase.from('missions').delete().eq('id', params.projectId);
}
```

---

## Multi-Tenant Isolation

### Database-Level Isolation (Supabase RLS)

```sql
-- Row-Level Security (RLS) implementation using Supabase Auth
-- Enable RLS on all tenant tables
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
-- ... all tenant tables

-- Create policy for tenant isolation using auth.uid()
CREATE POLICY "Users can access their org's missions" ON missions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their org's actions" ON actions
  FOR ALL USING (
    project_id IN (
      SELECT id FROM missions
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Supabase automatically enforces isolation
-- auth.uid() returns the authenticated user's ID from JWT
-- No manual context setting required!
```

### Application-Level Security (Automatic with Supabase)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    }
  );
}

// Usage - RLS automatically applied
const supabase = createClient();

// This query automatically filters by user's org
const { data: missions } = await supabase
  .from('missions')
  .select('*');
// Returns only missions from user's organization

// Attempting to access other org's data returns empty/error
const { data } = await supabase
  .from('missions')
  .select('*')
  .eq('id', 'project_from_other_org');
// Returns null or empty (RLS blocks it)
```

**Key Security Benefits:**
1. **Database-enforced**: Isolation happens at database level, not application
2. **Automatic**: No manual context setting required
3. **JWT-based**: User identity extracted from JWT token
4. **Fail-secure**: If JWT is invalid, auth.uid() returns NULL → no data access
5. **Zero-trust**: Even if application has bugs, database blocks unauthorized access

### Agent Isolation

Agents can only access their assigned missions:

```typescript
// Check agent has access to mission
async function verifyAgentProjectAccess(
  agentId: string,
  projectId: string
): Promise<boolean> {
  const assignment = await db.query.agentAssignments.findFirst({
    where: and(
      eq(agentAssignments.agentId, agentId),
      eq(agentAssignments.projectId, projectId)
    ),
  });
  
  return !!assignment;
}
```

---

## API Security

### Request Validation

```typescript
// All requests validated with Zod
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate and sanitize input
  const validated = createTaskSchema.safeParse(body);
  
  if (!validated.success) {
    return Response.json({
      error: {
        code: 'VALIDATION_ERROR',
        details: validated.error.issues,
      },
    }, { status: 400 });
  }
  
  // Use validated.data (typed and sanitized)
}
```

### Rate Limiting

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different operations
export const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),
  
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
  
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:search',
  }),
  
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:webhook',
  }),
};

// Apply rate limit
export async function applyRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'api'
) {
  const limiter = rateLimiters[type];
  const { success, remaining, reset } = await limiter.limit(identifier);
  
  if (!success) {
    throw new RateLimitError({
      remaining,
      resetAt: new Date(reset),
    });
  }
  
  return { remaining, reset };
}
```

### CORS Configuration

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'https://app.agentcommandcenter.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Organization-ID',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours
          },
        ],
      },
    ];
  },
};
```

### Security Headers

```typescript
// middleware.ts
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.dev",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.clerk.dev wss://*.ably.io",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};
```

### Webhook Security

```typescript
// Verify webhook signatures
import { createHmac, timingSafeEqual } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Timing-safe comparison to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

// In webhook handler
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('X-Webhook-Signature');
  
  if (!verifyWebhookSignature(payload, signature!, process.env.WEBHOOK_SECRET!)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Process webhook...
}
```

---

## Data Protection

### Encryption at Rest

| Data | Encryption | Key Management |
|------|------------|----------------|
| Database | AES-256 (provider managed) | AWS/Neon KMS |
| File Storage | AES-256 (Vercel/S3) | Provider KMS |
| Redis Cache | TLS + encryption | Upstash managed |
| Backups | AES-256 | Provider KMS |

### Encryption in Transit

- All connections over TLS 1.3
- HSTS enabled
- Certificate pinning for mobile (future)

### Sensitive Data Handling

```typescript
// Encrypt sensitive fields before storage
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Used for integration credentials
const integration = await db.insert(integrations).values({
  provider: 'github',
  credentialsEncrypted: encrypt(JSON.stringify(credentials)),
});
```

### PII Handling

| PII Type | Storage | Retention | Deletion |
|----------|---------|-----------|----------|
| Email | Database | Account lifetime | On deletion |
| Name | Database | Account lifetime | On deletion |
| IP Address | Logs only | 90 days | Auto-purge |
| Session Data | Redis | 7 days | Auto-expire |

### Data Retention

```sql
-- Automatic data cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete audit logs older than 2 years
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Delete notifications older than 90 days
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete soft-deleted records older than 30 days
  DELETE FROM missions
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Run daily
SELECT cron.schedule('cleanup_old_data', '0 3 * * *', 'SELECT cleanup_old_data()');
```

---

## Audit Logging

### Audit Events

```typescript
// lib/audit/log.ts
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assign'
  | 'unassign'
  | 'login'
  | 'logout'
  | 'invite'
  | 'remove'
  | 'export';

export interface AuditEntry {
  organizationId: string;
  actorType: 'user' | 'agent' | 'system';
  actorId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function audit(entry: AuditEntry) {
  await db.insert(auditLogs).values({
    ...entry,
    createdAt: new Date(),
  });
}

// Usage
await audit({
  organizationId: org.id,
  actorType: 'user',
  actorId: user.id,
  action: 'delete',
  resourceType: 'mission',
  resourceId: mission.id,
  oldValues: { name: mission.name, status: mission.status },
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

### Audit Log Queries

```typescript
// Get audit history for resource
const history = await db.query.auditLogs.findMany({
  where: and(
    eq(auditLogs.resourceType, 'mission'),
    eq(auditLogs.resourceId, projectId)
  ),
  orderBy: desc(auditLogs.createdAt),
  limit: 100,
});

// Get user activity
const activity = await db.query.auditLogs.findMany({
  where: and(
    eq(auditLogs.actorType, 'user'),
    eq(auditLogs.actorId, userId)
  ),
  orderBy: desc(auditLogs.createdAt),
  limit: 50,
});
```

---

## Security Monitoring

### Alerts Configuration

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| Failed Logins | > 5 per minute | High | Temporary block, notify user |
| Rate Limit Spike | > 1000% normal | Medium | Investigate source |
| Suspicious Activity | Unusual patterns | High | Manual review |
| Data Export | Large export | Medium | Log and monitor |
| Permission Escalation | Role change | Low | Log for audit |

### Security Incident Response

1. **Detect**: Automated monitoring alerts
2. **Contain**: Revoke tokens, block IPs
3. **Assess**: Determine scope and impact
4. **Notify**: Affected users if required
5. **Remediate**: Fix vulnerability
6. **Review**: Post-incident analysis

---

## Compliance

### GDPR Compliance

- [ ] Data portability (export user data)
- [ ] Right to deletion (delete user data)
- [ ] Consent management (opt-in features)
- [ ] Data processing agreements
- [ ] Privacy policy
- [ ] Cookie consent

### SOC 2 Preparation

- [ ] Access controls documented
- [ ] Encryption at rest and transit
- [ ] Audit logging
- [ ] Incident response plan
- [ ] Business continuity plan
- [ ] Vendor security review

### Data Processing Agreement

```typescript
// Track consent
interface UserConsent {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'essential';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
}
```

---

## Security Checklist

### Pre-Launch

- [ ] All secrets in environment variables
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Security headers set
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection
- [ ] Audit logging enabled
- [ ] Error messages don't leak info
- [ ] Dependencies audited (`pnpm audit`)
- [ ] Penetration test scheduled

### Ongoing

- [ ] Weekly dependency updates
- [ ] Monthly security review
- [ ] Quarterly penetration test
- [ ] Annual security audit
- [ ] Incident response drill

---

*Document maintained by: Security Team*
*Next review: 2026-03-01*
