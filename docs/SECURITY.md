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
  │ Browser │────▶│   Clerk     │────▶│   Next.js    │────▶│   API   │
  │         │     │   Auth      │     │  Middleware  │     │ Routes  │
  └─────────┘     └─────────────┘     └──────────────┘     └─────────┘
       │                │                    │                  │
       │  1. Login      │                    │                  │
       │───────────────▶│                    │                  │
       │                │                    │                  │
       │  2. MFA (if enabled)               │                  │
       │◀──────────────▶│                    │                  │
       │                │                    │                  │
       │  3. JWT Token  │                    │                  │
       │◀───────────────│                    │                  │
       │                │                    │                  │
       │  4. Request with Bearer Token       │                  │
       │─────────────────────────────────────▶│                  │
       │                │                    │                  │
       │                │  5. Verify JWT     │                  │
       │                │◀───────────────────│                  │
       │                │                    │                  │
       │                │  6. Claims + Org   │                  │
       │                │───────────────────▶│                  │
       │                │                    │                  │
       │                │                    │  7. Set tenant   │
       │                │                    │     context      │
       │                │                    │─────────────────▶│
       │                │                    │                  │
       │  8. Response                        │                  │
       │◀─────────────────────────────────────────────────────────│
```

### Clerk Configuration

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/v1/health',
]);

const isApiRoute = createRouteMatcher(['/api/(.*)']);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
  
  // Set security headers
  const response = auth();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
});

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

Clerk provides MFA out of the box:

- **TOTP**: Authenticator apps (recommended)
- **SMS**: Backup option
- **Backup Codes**: Recovery method

**Enforcement Levels:**
- Free: Optional
- Pro: Encouraged
- Enterprise: Required for admins

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
                                    │ (Full project
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
| View projects | ✅ | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ✅ | ❌ | ❌ |
| View tasks | ✅ | ✅ | ✅ | ✅ |
| Create/edit tasks | ✅ | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ✅ | ❌ |
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
  | 'projects:read'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  | 'tasks:read'
  | 'tasks:create'
  | 'tasks:update'
  | 'tasks:delete'
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
    'projects:*',
    'tasks:*',
    'agents:*',
    'knowledge:*',
    'members:invite',
    'members:remove',
    'settings:manage',
    'audit:read',
  ],
  member: [
    'projects:read',
    'projects:create',
    'projects:update',
    'tasks:*',
    'knowledge:read',
    'knowledge:create',
  ],
  viewer: [
    'projects:read',
    'tasks:read',
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
import { auth } from '@clerk/nextjs/server';
import { hasPermission, Permission } from './permissions';

export function requirePermission(permission: Permission) {
  return async function authorize() {
    const { userId, orgId, orgRole } = auth();
    
    if (!userId || !orgId) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (!hasPermission(orgRole, permission)) {
      throw new ForbiddenError(`Missing permission: ${permission}`);
    }
    
    return { userId, orgId, orgRole };
  };
}

// Usage in API route
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const { orgId } = await requirePermission('projects:delete')();
  
  // Delete project...
}
```

---

## Multi-Tenant Isolation

### Database-Level Isolation

```sql
-- Row-Level Security (RLS) implementation
-- Enable RLS on all tenant tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
-- ... all tenant tables

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON projects
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id')::uuid)
  WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

-- Prevent cross-tenant data access
-- Even if application has a bug, database enforces isolation
```

### Application-Level Isolation

```typescript
// lib/db/tenant-context.ts
import { db } from '@repo/database';
import { sql } from 'drizzle-orm';

export async function withTenantContext<T>(
  organizationId: string,
  operation: () => Promise<T>
): Promise<T> {
  // Set tenant context
  await db.execute(sql`SET app.current_org_id = ${organizationId}`);
  
  try {
    return await operation();
  } finally {
    // Clear context
    await db.execute(sql`RESET app.current_org_id`);
  }
}

// Middleware sets context for every request
// server/db/middleware.ts
export async function dbMiddleware(
  request: Request,
  context: { organizationId: string }
) {
  return withTenantContext(context.organizationId, async () => {
    // All database operations within this context
    // are automatically filtered by organization_id
  });
}
```

### Agent Isolation

Agents can only access their assigned projects:

```typescript
// Check agent has access to project
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
  DELETE FROM projects
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
  resourceType: 'project',
  resourceId: project.id,
  oldValues: { name: project.name, status: project.status },
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

### Audit Log Queries

```typescript
// Get audit history for resource
const history = await db.query.auditLogs.findMany({
  where: and(
    eq(auditLogs.resourceType, 'project'),
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
