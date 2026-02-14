# ADR-001: AI/LLM Integration Strategy for Cohortix

**Status:** Proposed  
**Date:** 2026-02-14  
**Author:** Devi (AI Developer Specialist)  
**Reviewers:** Ahmad (CEO), Idris (Architect), Alim (CEO Operations)  
**Related ADRs:** None

---

## Context

**What problem requires a decision?**

Cohortix is adding AI-powered features to enhance project management for AI teams:

1. **Smart Triage** — Auto-assign tasks based on historical ownership patterns and team expertise
2. **Health Pulse** — Analyze activity logs and project metrics to determine project health (On Track/At Risk/Critical)
3. **Generative Subtasks** — Break down complex tasks into actionable subtasks using LLM reasoning

These features require Large Language Model (LLM) capabilities, and we must decide how to integrate AI/LLM services into the platform.

**User Context:**
- **User Persona:** AI team leads, product managers, and developers who manage AI/ML projects
- **User Goal:** Automate project management overhead while maintaining control and transparency
- **Current Pain Point:** Manual triaging, subjective health assessments, and time-consuming task breakdowns

**Technical Constraints:**
- Existing stack: Next.js 14, Supabase (Postgres + Auth + Edge Functions), Drizzle ORM, Clerk auth
- Must support multiple LLM providers (OpenAI, Anthropic, etc.)
- Need real-time updates for generated content
- Must handle rate limiting and cost control
- Security: No API keys should be exposed client-side

**Business Constraints:**
- Target market: AI teams who likely already have LLM API keys and/or OpenClaw setups
- Need sustainable cost structure (AI features can be expensive)
- Must differentiate from generic project management tools
- Want to avoid vendor lock-in to single LLM provider

**Assumptions:**
- AI teams are technically sophisticated and comfortable with API keys
- Most target users already pay for OpenAI/Anthropic/Claude access
- OpenClaw adoption is growing among AI teams (but not universal)
- Users want transparency and control over AI costs

---

## Decision

**We will implement a HYBRID approach (Option D) with the following architecture:**

### Phase 1: BYOK Foundation (MVP)
Launch with Bring Your Own Key (BYOK) where users provide their own OpenAI or Anthropic API keys. Platform routes AI requests through user-provided credentials.

### Phase 2: Platform-Provided AI (Growth)
Add optional platform-provided AI for users who want simplicity over control. Cohortix maintains its own API keys and meters usage (included in plan tiers or pay-as-you-go).

### Phase 3: OpenClaw Integration (Differentiation)
For advanced users, enable OpenClaw agent delegation where Cohortix can offload AI tasks to users' existing OpenClaw instances via API.

**Rationale:**

1. **Start with BYOK minimizes platform risk** — No upfront AI infrastructure costs, no billing complexity on Day 1
2. **Target market already has keys** — AI teams are the ideal BYOK audience
3. **Platform AI unlocks growth** — Non-technical teams and trial users need zero-friction onboarding
4. **OpenClaw is strategic differentiation** — Positions Cohortix as the project manager FOR AI teams, not just WITH AI features

---

## Options Considered

### Option A: BYOK (Bring Your Own Key) Only

**Description:**  
Users add their OpenAI/Anthropic API keys in settings. Cohortix routes all AI requests through user-provided credentials. Keys are encrypted at rest and never logged.

**Technical Architecture:**
```typescript
// User settings
interface AISettings {
  provider: 'openai' | 'anthropic';
  apiKey: string; // AES-256 encrypted in database
  model?: string; // e.g., 'gpt-4o', 'claude-sonnet-4'
  rateLimit?: number; // User-defined monthly token cap
}

// Server-side AI call (Next.js API route)
async function callLLM(userId: string, prompt: string) {
  const settings = await getDecryptedAISettings(userId);
  const client = createLLMClient(settings.provider, settings.apiKey);
  return await client.chat.completions.create({...});
}
```

**Pros:**
- ✅ **Zero platform AI costs** — Users pay their own LLM bills
- ✅ **Perfect for target market** — AI teams already have keys
- ✅ **Full control and transparency** — Users see exact API usage in their dashboards
- ✅ **No billing complexity** — No metered AI usage tracking needed
- ✅ **Fast MVP** — Simplest architecture to implement
- ✅ **Regulatory compliance** — User data processed via user's own API keys reduces liability

**Cons:**
- ❌ **Onboarding friction** — New users must create OpenAI/Anthropic accounts before trying AI features
- ❌ **Poor trial experience** — Can't demo AI features without API key
- ❌ **Support burden** — Users will blame Cohortix for LLM provider issues (rate limits, outages)
- ❌ **No margin on AI** — Can't monetize AI capabilities directly
- ❌ **Security risk** — Storing user API keys (even encrypted) is a liability
- ❌ **Limited optimization** — Can't implement platform-wide prompt caching or batching

**Why not chosen as sole option:**  
While ideal for initial launch, it limits growth potential and creates onboarding friction for non-AI-savvy users.

---

### Option B: Platform-Provided AI Only

**Description:**  
Cohortix owns all API keys and bills users for AI usage. AI costs either included in plan tiers or metered separately.

**Technical Architecture:**
```typescript
// Platform-wide AI configuration
const AI_CONFIG = {
  defaultModel: 'gpt-4o-mini', // Cost-optimized
  premiumModel: 'claude-sonnet-4', // Pro plans only
  rateLimits: {
    free: 100, // tokens per day
    pro: 10000,
    enterprise: unlimited
  }
};

// Metered usage tracking
interface AIUsageLog {
  userId: string;
  feature: 'triage' | 'health_pulse' | 'subtask_generation';
  tokensUsed: number;
  cost: number; // In cents
  timestamp: Date;
}

// Monthly billing
async function calculateAIBill(userId: string, month: string) {
  const usage = await getAIUsage(userId, month);
  return usage.reduce((total, log) => total + log.cost, 0);
}
```

**Pros:**
- ✅ **Zero-friction onboarding** — AI works immediately for new users
- ✅ **Monetization opportunity** — Markup on AI costs (e.g., 2x cost + $0.01/1k tokens)
- ✅ **Better trial experience** — Free tier includes AI credits
- ✅ **Platform optimizations** — Prompt caching, batching, model routing
- ✅ **Simplified UX** — No API key management UI needed
- ✅ **Predictable pricing** — Tiered plans include AI budgets

**Cons:**
- ❌ **High platform risk** — Cohortix fronts all AI costs (abuse risk)
- ❌ **Billing complexity** — Need metering, quotas, overage handling
- ❌ **Cost transparency issues** — Users don't see raw LLM costs
- ❌ **Vendor lock-in** — Users can't bring their own models or providers
- ❌ **Lower margin for AI teams** — Target market prefers BYOK to avoid markup
- ❌ **Scaling costs** — AI bills grow with user base before revenue catches up

**Why not chosen as sole option:**  
High risk for early-stage platform. Target market (AI teams) prefers control over convenience.

---

### Option C: OpenClaw Agent Integration Only

**Description:**  
Users connect their OpenClaw instance via API. Cohortix delegates AI tasks to OpenClaw agents (e.g., "Analyze this project and determine health status").

**Technical Architecture:**
```typescript
// User connects OpenClaw instance
interface OpenClawConnection {
  gatewayUrl: string; // e.g., https://gateway.openclaw.ai
  apiToken: string; // JWT for OpenClaw API
  assignedAgent?: string; // Default agent for tasks
}

// Delegate task to OpenClaw
async function delegateToOpenClaw(userId: string, task: AITask) {
  const connection = await getOpenClawConnection(userId);
  
  // Spawn agent session
  const session = await fetch(`${connection.gatewayUrl}/v1/sessions/spawn`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${connection.apiToken}` },
    body: JSON.stringify({
      agent: connection.assignedAgent,
      task: task.prompt,
      context: task.data
    })
  });
  
  // Poll for results
  return await pollSessionResults(session.id);
}
```

**Pros:**
- ✅ **Strategic differentiation** — Only PM tool with agent integration
- ✅ **Advanced capabilities** — OpenClaw agents can do more than basic LLM calls (tool use, multi-step reasoning)
- ✅ **Zero AI costs** — Users pay OpenClaw directly
- ✅ **Perfect for AI teams** — Target market likely already uses OpenClaw
- ✅ **Extensibility** — Users can customize agents for their workflow

**Cons:**
- ❌ **Tiny addressable market** — OpenClaw adoption is early-stage
- ❌ **Complex UX** — Requires users to set up and maintain OpenClaw
- ❌ **Reliability risk** — Dependent on user's OpenClaw instance availability
- ❌ **Latency issues** — Agent sessions can take minutes, not seconds
- ❌ **Feature parity problems** — Can't guarantee all features work across agent configurations
- ❌ **Support nightmare** — Debugging issues across two platforms

**Why not chosen as sole option:**  
Too niche for initial launch. Most users don't have OpenClaw yet.

---

### Option D: Hybrid (BYOK + Platform AI + OpenClaw) ✅ **SELECTED**

**Description:**  
Implement all three approaches in phases:

1. **Phase 1 (MVP)**: BYOK — Target market can use AI features immediately with their own keys
2. **Phase 2 (Growth)**: Platform AI — Add for users who want simplicity (free tier + paid plans)
3. **Phase 3 (Differentiation)**: OpenClaw — Enable for advanced users as premium capability

**Technical Architecture:**
```typescript
// Unified AI router
interface AIProviderConfig {
  type: 'byok' | 'platform' | 'openclaw';
  // BYOK fields
  apiKey?: string;
  provider?: 'openai' | 'anthropic';
  // Platform fields
  planTier?: 'free' | 'pro' | 'enterprise';
  // OpenClaw fields
  gatewayUrl?: string;
  agentToken?: string;
}

async function executeAITask(userId: string, task: AITask): Promise<AIResult> {
  const config = await getAIProviderConfig(userId);
  
  switch (config.type) {
    case 'byok':
      return await executeBYOK(config, task);
    case 'platform':
      return await executePlatform(config, task);
    case 'openclaw':
      return await executeOpenClaw(config, task);
  }
}

// Fallback chain for resilience
async function executeWithFallback(userId: string, task: AITask) {
  const config = await getAIProviderConfig(userId);
  
  try {
    // Try primary provider
    return await executeAITask(userId, task);
  } catch (error) {
    // Fallback to platform AI (if user has credits)
    if (await hasAICredits(userId)) {
      return await executePlatform({ type: 'platform', planTier: 'pro' }, task);
    }
    throw error;
  }
}
```

**Database Schema:**
```sql
-- User AI configuration
CREATE TABLE ai_configs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('byok', 'platform', 'openclaw')),
  
  -- BYOK fields
  byok_provider TEXT CHECK (byok_provider IN ('openai', 'anthropic')),
  byok_api_key_encrypted TEXT, -- AES-256 encrypted
  byok_model TEXT,
  
  -- Platform fields
  platform_monthly_quota INTEGER,
  platform_quota_used INTEGER DEFAULT 0,
  platform_overage_allowed BOOLEAN DEFAULT false,
  
  -- OpenClaw fields
  openclaw_gateway_url TEXT,
  openclaw_api_token_encrypted TEXT,
  openclaw_default_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI usage logs (for all provider types)
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  provider_type TEXT NOT NULL,
  feature TEXT NOT NULL, -- 'triage', 'health_pulse', 'subtask_generation'
  
  -- Cost tracking
  tokens_used INTEGER,
  cost_cents INTEGER, -- Null for BYOK/OpenClaw
  
  -- Performance
  latency_ms INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at);
```

**Pros:**
- ✅ **Best of all worlds** — Technical users get control, non-technical get convenience
- ✅ **Phased rollout** — Start simple (BYOK), add complexity as market validates
- ✅ **Monetization flexibility** — Can charge for AI or make it free depending on competition
- ✅ **Strategic positioning** — OpenClaw integration is unique differentiator
- ✅ **User choice** — Let market decide which approach wins
- ✅ **Risk mitigation** — Not dependent on single approach succeeding

**Cons:**
- ❌ **Maximum complexity** — Three codepaths to maintain
- ❌ **Testing burden** — Must test all provider types for every AI feature
- ❌ **UI complexity** — Settings page needs to handle three modes elegantly
- ❌ **Migration challenges** — Users switching between providers need data continuity

**Why chosen:**  
Balances immediate market fit (BYOK for AI teams) with long-term growth (Platform AI for mainstream) and strategic differentiation (OpenClaw for power users). Phased approach reduces initial risk.

---

## Implementation Plan

### Phase 1: BYOK Foundation (Weeks 1-3)

**Goal:** Launch MVP with BYOK for OpenAI and Anthropic.

**Deliverables:**

1. **User Settings UI** (`apps/web/app/(authenticated)/settings/ai/page.tsx`)
   - AI provider selection (OpenAI / Anthropic)
   - API key input (masked, encrypted on submit)
   - Model selection dropdown
   - Test connection button
   - Usage stats (from user's provider dashboard link)

2. **Backend API** (`apps/web/app/api/ai/[feature]/route.ts`)
   ```typescript
   // POST /api/ai/triage
   export async function POST(req: Request) {
     const { taskId } = await req.json();
     const userId = await getUserId(req);
     
     // Get user's AI config
     const aiConfig = await db.query.aiConfigs.findFirst({
       where: eq(aiConfigs.userId, userId)
     });
     
     if (!aiConfig || aiConfig.providerType !== 'byok') {
       return Response.json({ error: 'BYOK not configured' }, { status: 400 });
     }
     
     // Decrypt API key (server-side only)
     const apiKey = await decrypt(aiConfig.byokApiKeyEncrypted);
     
     // Call LLM
     const result = await triageTask(apiKey, aiConfig.byokProvider, taskId);
     
     // Log usage (no cost tracking for BYOK)
     await logAIUsage(userId, 'byok', 'triage', result.tokensUsed);
     
     return Response.json(result);
   }
   ```

3. **LLM Client Abstraction** (`packages/ai/src/clients/`)
   ```typescript
   // packages/ai/src/clients/factory.ts
   export function createLLMClient(provider: string, apiKey: string) {
     switch (provider) {
       case 'openai':
         return new OpenAI({ apiKey });
       case 'anthropic':
         return new Anthropic({ apiKey });
       default:
         throw new Error(`Unsupported provider: ${provider}`);
     }
   }
   
   // packages/ai/src/features/triage.ts
   export async function triageTask(
     client: OpenAI | Anthropic,
     task: Task
   ): Promise<TriageResult> {
     const prompt = buildTriagePrompt(task);
     // Unified interface for both providers
     const response = await client.chat.completions.create({
       model: 'gpt-4o', // or claude-sonnet-4
       messages: [{ role: 'user', content: prompt }]
     });
     return parseTriageResponse(response);
   }
   ```

4. **Security Implementation**
   - AES-256-GCM encryption for API keys at rest
   - Keys only decrypted server-side (never sent to client)
   - Rate limiting on AI endpoints (10 req/min per user)
   - Input validation (max prompt length: 8000 chars)

5. **AI Features Implementation**
   - **Smart Triage**: Analyze task + historical assignments → suggest owner
   - **Health Pulse**: Analyze project activity → set health status
   - **Generative Subtasks**: Break down task → create subtask list

**Testing:**
- Unit tests for LLM client abstraction
- Integration tests with OpenAI/Anthropic test keys
- E2E tests for full triage flow
- Security audit of key encryption

**Success Metrics:**
- 60% of beta users configure BYOK within first week
- <500ms p95 latency for triage endpoint
- Zero API key leaks in logs/client-side code

---

### Phase 2: Platform-Provided AI (Weeks 4-8)

**Goal:** Add Cohortix-managed AI for users without API keys.

**Deliverables:**

1. **Platform AI Infrastructure**
   - Cohortix OpenAI/Anthropic accounts with org-level rate limits
   - Environment variables for platform keys (rotated monthly)
   - Monitoring for cost anomalies (Sentry alerts >$100/day)

2. **Quota System**
   ```typescript
   // Free tier: 1000 tokens/month (≈ 50 AI requests)
   // Pro tier: 50,000 tokens/month (≈ 2,500 requests)
   // Enterprise: Unlimited with custom pricing
   
   async function checkQuota(userId: string): Promise<boolean> {
     const usage = await getMonthlyUsage(userId);
     const tier = await getUserPlanTier(userId);
     const quota = QUOTA_LIMITS[tier];
     return usage < quota;
   }
   ```

3. **Billing Integration** (Stripe)
   - Add AI usage to invoice line items
   - Overage charges: $0.02/1k tokens (2x LLM cost)
   - Real-time quota usage display in UI

4. **Fallback Logic**
   ```typescript
   // If BYOK fails (invalid key, rate limit), offer platform AI
   if (byokError && await hasAICredits(userId)) {
     const usePlatform = await confirmFallback(userId);
     if (usePlatform) {
       return await executePlatform(task);
     }
   }
   ```

**Success Metrics:**
- 30% of users opt for platform AI over BYOK
- <$2 AI cost per active user per month
- 95% quota compliance (no frequent overage hits)

---

### Phase 3: OpenClaw Integration (Weeks 9-12)

**Goal:** Enable advanced users to delegate AI tasks to OpenClaw agents.

**Deliverables:**

1. **OpenClaw SDK** (`packages/openclaw-client/`)
   ```typescript
   export class OpenClawClient {
     constructor(gatewayUrl: string, apiToken: string) {}
     
     async spawnSession(agent: string, task: string): Promise<Session> {}
     async getSessionStatus(sessionId: string): Promise<SessionStatus> {}
     async getSessionResult(sessionId: string): Promise<any> {}
   }
   ```

2. **Connection UI**
   - OpenClaw gateway URL input
   - API token configuration
   - Test connection + list available agents
   - Agent selection for each AI feature

3. **Async Task Queue** (Inngest/Trigger.dev)
   - OpenClaw sessions can take 30s-5min
   - Queue tasks, poll for completion
   - Webhook callback when agent finishes
   - Show "AI is thinking..." UI state

4. **Advanced Features**
   - Agent can use tools (web search, code execution)
   - Multi-step reasoning for complex breakdowns
   - Custom prompts per user/agent

**Success Metrics:**
- 10% of Pro users connect OpenClaw
- <2min p95 latency for agent-delegated tasks
- 90% success rate (agent completes task)

---

## Architecture Diagrams

### Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        COHORTIX AI ROUTER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User → AI Feature Request → detectProviderType()               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ BYOK         │  │ Platform AI  │  │ OpenClaw     │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ User API Key │  │ Cohortix Key │  │ Agent API    │          │
│  │ → OpenAI     │  │ → OpenAI     │  │ → OpenClaw   │          │
│  │   Anthropic  │  │   Anthropic  │  │   Gateway    │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ Instant      │  │ Quota Check  │  │ Async Queue  │          │
│  │ No Cost      │  │ Metered Bill │  │ Polling      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ↓                  ↓                  ↓                         │
│  AI Response → Parse → Update DB → Realtime → Client            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Smart Triage (BYOK)

```
User clicks "Auto-Assign" on Task
    ↓
Frontend: POST /api/ai/triage { taskId }
    ↓
Backend: 
  1. Authenticate user (Clerk/Supabase)
  2. Load ai_configs table → providerType = 'byok'
  3. Decrypt byok_api_key_encrypted
  4. Fetch task details + historical assignments
  5. Build prompt: "Who should own this task?"
  6. Call OpenAI API with user's key
  7. Parse response: { suggestedOwner: "user-id", confidence: 0.85 }
  8. Log usage (tokens, latency) to ai_usage_logs
  9. Return suggestion to frontend
    ↓
Frontend: Show suggestion modal
  "Suggested owner: @alice (85% confidence)"
  [Accept] [Reject]
    ↓
User accepts → Update task.assignee → Realtime update
```

### Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    API KEY SECURITY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client (Browser)                                            │
│    ↓                                                         │
│  POST /api/ai/settings { apiKey: "sk-..." }                 │
│    ↓                                                         │
│  Server (Next.js API Route) — HTTPS only                    │
│    1. Validate API key format                               │
│    2. Test connection to LLM provider                       │
│    3. Encrypt with AES-256-GCM (server-side key)            │
│    4. Store encrypted in Supabase: byok_api_key_encrypted   │
│    5. Never log plaintext key                               │
│    ↓                                                         │
│  AI Request:                                                 │
│    1. Decrypt key (server-side only, never sent to client)  │
│    2. Use for single request                                │
│    3. Discard from memory                                   │
│                                                              │
│  Encryption Key Management:                                  │
│    - Master key stored in Vercel environment variables      │
│    - Rotated every 90 days                                  │
│    - Re-encrypt all API keys on rotation                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Analysis

### BYOK (Phase 1)
- **Platform Cost**: $0/month
- **User Cost**: Variable (user pays LLM provider directly)
- **Estimate**: $2-10/user/month depending on usage
- **Cohortix Revenue**: $0 (no margin on AI)

### Platform AI (Phase 2)
| Plan | Quota (tokens/mo) | LLM Cost | Markup | User Pays |
|------|-------------------|----------|--------|-----------|
| Free | 1,000 | $0.02 | — | $0 (included) |
| Pro | 50,000 | $1.00 | 2x | $2/mo |
| Enterprise | Unlimited | Variable | 1.5x | Custom |

**Platform Cost at Scale:**
- 1,000 active users × 50k tokens avg = 50M tokens/month
- Cost: ≈$1,000/month (using GPT-4o-mini at $0.02/1M tokens)
- Revenue: ≈$2,000/month (2x markup)
- **Gross Margin**: 50%

**Risk Mitigation:**
- Rate limits per user (prevent abuse)
- Anomaly detection (flag >100k tokens/day)
- Auto-downgrade to free tier on overage (with notice)

### OpenClaw (Phase 3)
- **Platform Cost**: $0/month (users pay OpenClaw directly)
- **User Cost**: Variable (OpenClaw pricing)
- **Cohortix Revenue**: $0 (strategic feature, not monetized)

---

## Technical Implementation Details

### BYOK: API Key Encryption

```typescript
// packages/security/src/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, MASTER_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate master key (run once, store in env)
export function generateMasterKey(): string {
  return randomBytes(32).toString('hex');
}
```

### LLM Client Abstraction

```typescript
// packages/ai/src/clients/unified-client.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type LLMProvider = 'openai' | 'anthropic';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
}

export class UnifiedLLMClient {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  
  constructor(provider: LLMProvider, apiKey: string) {
    if (provider === 'openai') {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.anthropic = new Anthropic({ apiKey });
    }
  }
  
  async chatCompletion(
    messages: ChatMessage[],
    model?: string
  ): Promise<ChatCompletionResponse> {
    if (this.openai) {
      return this.openaiCompletion(messages, model || 'gpt-4o');
    } else if (this.anthropic) {
      return this.anthropicCompletion(messages, model || 'claude-sonnet-4');
    }
    throw new Error('No LLM client initialized');
  }
  
  private async openaiCompletion(
    messages: ChatMessage[],
    model: string
  ): Promise<ChatCompletionResponse> {
    const response = await this.openai!.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });
    
    return {
      content: response.choices[0].message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      finishReason: response.choices[0].finish_reason,
    };
  }
  
  private async anthropicCompletion(
    messages: ChatMessage[],
    model: string
  ): Promise<ChatCompletionResponse> {
    // Convert messages to Anthropic format (system separate)
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const response = await this.anthropic!.messages.create({
      model,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      max_tokens: 4096,
    });
    
    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    return {
      content,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
      finishReason: response.stop_reason || 'end_turn',
    };
  }
}
```

### Smart Triage Prompt Engineering

```typescript
// packages/ai/src/features/triage.ts
import { db } from '@cohortix/db';
import { tasks, users } from '@cohortix/db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface TriageContext {
  task: {
    title: string;
    description: string;
    labels: string[];
    projectId: string;
  };
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    expertise: string[]; // From profile
    recentAssignments: number; // Count
  }>;
  historicalPatterns: Array<{
    taskPattern: string;
    assignedTo: string;
    completed: boolean;
  }>;
}

export async function buildTriagePrompt(taskId: string): Promise<TriageContext> {
  // Fetch task
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  
  // Fetch team members
  const teamMembers = await db.query.users.findMany({
    where: eq(users.projectId, task.projectId),
  });
  
  // Fetch historical assignments (last 90 days)
  const historical = await db.query.tasks.findMany({
    where: and(
      eq(tasks.projectId, task.projectId),
      // Similar labels or keywords
    ),
    orderBy: desc(tasks.createdAt),
    limit: 20,
  });
  
  return {
    task: {
      title: task.title,
      description: task.description,
      labels: task.labels,
      projectId: task.projectId,
    },
    teamMembers: teamMembers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      expertise: u.profileData?.expertise || [],
      recentAssignments: 0, // TODO: count
    })),
    historicalPatterns: historical.map(t => ({
      taskPattern: `${t.title} [${t.labels.join(', ')}]`,
      assignedTo: t.assigneeId,
      completed: t.status === 'completed',
    })),
  };
}

export function formatTriagePrompt(context: TriageContext): string {
  return `You are an AI project management assistant. Analyze this task and suggest the best team member to assign it to.

**Task:**
Title: ${context.task.title}
Description: ${context.task.description}
Labels: ${context.task.labels.join(', ')}

**Team Members:**
${context.teamMembers.map(m => `
- ${m.name} (${m.email})
  Expertise: ${m.expertise.join(', ') || 'Not specified'}
  Recent assignments: ${m.recentAssignments}
`).join('\n')}

**Historical Assignment Patterns (last 20 similar tasks):**
${context.historicalPatterns.map(p => `
- "${p.taskPattern}" → Assigned to ${p.assignedTo} → ${p.completed ? 'Completed' : 'Incomplete'}
`).join('\n')}

**Your Task:**
1. Analyze the task requirements
2. Match against team member expertise and availability
3. Consider historical patterns (who successfully completed similar tasks?)
4. Suggest ONE team member with a confidence score (0-100%)

**Response Format (JSON only):**
{
  "suggestedOwner": "user-id-here",
  "ownerName": "Alice Smith",
  "confidence": 85,
  "reasoning": "Alice has completed 5 similar ML pipeline tasks in the past with 100% success rate. Her expertise in Python and TensorFlow matches this task perfectly. Current workload is below average."
}`;
}

export async function executeTriage(
  client: UnifiedLLMClient,
  taskId: string
): Promise<TriageResult> {
  const context = await buildTriagePrompt(taskId);
  const prompt = formatTriagePrompt(context);
  
  const response = await client.chatCompletion([
    { role: 'system', content: 'You are a helpful AI assistant.' },
    { role: 'user', content: prompt },
  ]);
  
  // Parse JSON response
  const result = JSON.parse(response.content);
  
  return {
    suggestedOwner: result.suggestedOwner,
    ownerName: result.ownerName,
    confidence: result.confidence,
    reasoning: result.reasoning,
    tokensUsed: response.tokensUsed,
  };
}
```

---

## Monitoring & Observability

### Key Metrics to Track

```typescript
// packages/analytics/src/ai-metrics.ts

export interface AIMetrics {
  // Performance
  latencyP50: number; // ms
  latencyP95: number;
  latencyP99: number;
  
  // Success
  successRate: number; // %
  errorRate: number;
  timeoutRate: number;
  
  // Usage
  requestsPerMinute: number;
  tokensPerRequest: number;
  totalCostPerDay: number; // $
  
  // By feature
  triageRequests: number;
  healthPulseRequests: number;
  subtaskGenRequests: number;
  
  // By provider
  byokRequests: number;
  platformRequests: number;
  openclawRequests: number;
}

// Sentry custom instrumentation
import * as Sentry from '@sentry/nextjs';

export async function trackAIRequest(
  feature: string,
  provider: string,
  fn: () => Promise<any>
) {
  const transaction = Sentry.startTransaction({
    op: 'ai.request',
    name: `AI: ${feature}`,
    tags: { provider },
  });
  
  const start = Date.now();
  
  try {
    const result = await fn();
    const latency = Date.now() - start;
    
    transaction.setTag('status', 'success');
    transaction.setMeasurement('latency', latency, 'millisecond');
    transaction.setData('tokens_used', result.tokensUsed);
    
    return result;
  } catch (error) {
    transaction.setTag('status', 'error');
    Sentry.captureException(error);
    throw error;
  } finally {
    transaction.finish();
  }
}
```

### Alerts

```yaml
# Sentry alerts configuration
alerts:
  - name: "AI High Error Rate"
    condition: "error_rate > 5%"
    window: "5 minutes"
    notify: "#engineering-alerts"
  
  - name: "AI Cost Spike"
    condition: "ai_cost_per_hour > $10"
    window: "1 hour"
    notify: "#finance-alerts"
  
  - name: "AI Latency P95 Degradation"
    condition: "p95_latency > 5000ms"
    window: "10 minutes"
    notify: "#engineering-alerts"
```

---

## Migration & Rollout Strategy

### Beta Testing (Week 1-2)

1. **Internal dogfooding** — Cohortix team tests with own API keys
2. **Select 10 design partners** — AI teams from Ahmad's network
3. **Feedback loop** — Weekly surveys + async Slack channel
4. **Iterate on prompts** — Tune based on triage accuracy

### Public Beta (Week 3-4)

1. **Waitlist launch** — Email 500 signups from landing page
2. **Onboarding flow:**
   - Sign up → Verify email → Create project
   - "Add AI superpowers" modal → Link to API key setup guide
   - Video tutorial: "Get your OpenAI key in 60 seconds"
3. **Support readiness:**
   - FAQ: Common API key issues
   - Live chat (Intercom) for first 100 users

### General Availability (Week 5+)

1. **Remove waitlist** — Open to all
2. **Launch blog post** — "Cohortix + AI: Smart project management for AI teams"
3. **Product Hunt launch** — Feature BYOK as unique differentiator
4. **Monitor metrics:**
   - Activation rate (% users who configure AI)
   - Retention (do users keep using AI features?)
   - NPS (would you recommend Cohortix AI?)

---

## User Experience Design

### Settings: AI Configuration

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│ Settings > AI Features                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AI Provider                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚪ Bring Your Own Key (BYOK)                         │   │
│  │    You provide your OpenAI or Anthropic API key     │   │
│  │    ✓ Full control  ✓ No markup  ✗ Setup required   │   │
│  │                                                      │   │
│  │ ⚪ Cohortix AI (Coming Soon)                         │   │
│  │    Use our AI credits (included in Pro plan)        │   │
│  │    ✓ No setup  ✓ Simple  ✗ Metered usage           │   │
│  │                                                      │   │
│  │ ⚪ OpenClaw Integration (Enterprise)                 │   │
│  │    Connect your OpenClaw instance for advanced AI   │   │
│  │    ✓ Most powerful  ✗ Complex setup                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Configure BYOK                                      │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ Provider: [OpenAI ▼]                                │    │
│  │                                                      │    │
│  │ API Key: [••••••••••••••••••sk-abc123] 🔒           │    │
│  │                                                      │    │
│  │ Model:   [gpt-4o (Recommended) ▼]                   │    │
│  │                                                      │    │
│  │ [Test Connection]  [Save]                           │    │
│  │                                                      │    │
│  │ Status: ✅ Connected (tested 2 min ago)             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Usage This Month                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Triage:         42 requests  (~8,400 tokens)        │    │
│  │ Health Pulse:   12 requests  (~2,400 tokens)        │    │
│  │ Subtasks:        7 requests  (~3,500 tokens)        │    │
│  │                                                      │    │
│  │ Total: 61 requests, ~14,300 tokens (~$0.29)         │    │
│  │                                                      │    │
│  │ [View detailed logs] → OpenAI Dashboard             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### In-App AI Feature: Smart Triage

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│ Task: Implement vector search for semantic task matching    │
├─────────────────────────────────────────────────────────────┤
│ Assigned to: [Unassigned ▼]  🤖 Auto-Assign                │
│                                                              │
│ Labels: [backend] [AI/ML] [database]                        │
│ Status: [Todo ▼]                                             │
│                                                              │
│ Description:                                                 │
│ Need to implement semantic search so users can find...      │
│                                                              │
│ ────────────────────────────────────────────────────────    │
│                                                              │
│ [User clicks "🤖 Auto-Assign"]                               │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🤖 AI Suggestion                                      │   │
│ ├──────────────────────────────────────────────────────┤   │
│ │                                                        │   │
│ │ Suggested owner: @alice (85% confidence)              │   │
│ │                                                        │   │
│ │ Reasoning:                                             │   │
│ │ Alice has completed 5 similar ML pipeline tasks with  │   │
│ │ 100% success rate. Her expertise in Python and        │   │
│ │ vector databases matches this task perfectly.         │   │
│ │ Current workload is below team average.               │   │
│ │                                                        │   │
│ │ [Assign to Alice] [Suggest Someone Else] [Cancel]     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Users don't configure BYOK** (friction too high) | Medium | High | Phase 2: Platform AI fallback |
| **API key security breach** | Low | Critical | AES-256, rotation, audit logs, bug bounty |
| **LLM hallucinations** (bad assignments) | High | Medium | Show confidence scores, allow override, feedback loop |
| **Cost explosion** (platform AI abuse) | Medium | High | Rate limits, quotas, anomaly detection |
| **OpenClaw complexity** (support burden) | High | Low | Enterprise-only, dedicated support |
| **Vendor lock-in** (OpenAI changes pricing) | Medium | Medium | Multi-provider support from Day 1 |
| **Latency issues** (AI too slow) | Low | Medium | Async processing, optimistic UI, caching |

---

## Success Metrics

### Phase 1 (BYOK) — Week 4
- ✅ 50% of beta users configure AI within first week
- ✅ 80% of configured users use AI at least once per week
- ✅ <2s p95 latency for triage requests
- ✅ 70%+ satisfaction score ("AI suggestions are helpful")

### Phase 2 (Platform AI) — Week 8
- ✅ 30% of new users choose platform AI over BYOK
- ✅ <$3 AI cost per active user per month
- ✅ 90% quota compliance (no frequent overage)
- ✅ Net margin positive on AI features

### Phase 3 (OpenClaw) — Week 12
- ✅ 10% of Enterprise users connect OpenClaw
- ✅ <3min p95 latency for agent-delegated tasks
- ✅ 5+ case studies of "advanced AI workflows"

---

## Open Questions & Future Work

### Open Questions (Resolve before Phase 1)

1. **API Key Rotation:** How often should users rotate keys? Notify them?
2. **Model Selection:** Let users pick models (gpt-4o vs gpt-4o-mini) or hide complexity?
3. **Failure Handling:** If user's key is invalid, should we auto-fallback to platform AI (if they have credits)?
4. **Data Privacy:** Can we cache prompts/responses for performance? (Answer: No for BYOK, yes for platform AI with opt-out)

### Future Enhancements (Post-MVP)

1. **Prompt Customization** — Let users edit system prompts for AI features
2. **Multi-Model Routing** — Use cheap models for simple tasks, expensive for complex
3. **Fine-Tuning** — Train custom models on user's historical data (enterprise feature)
4. **Agent Marketplace** — Pre-built OpenClaw agents for common PM workflows
5. **AI Copilot Chat** — Conversational interface: "Show me all at-risk projects"
6. **Predictive Analytics** — "This project will likely miss deadline based on velocity"

---

## References

**Design Inspiration:**
- Linear: Simple, elegant AI features (not overwhelming)
- Notion AI: BYOK + platform hybrid model
- Cursor: AI integration in developer tools

**Technical References:**
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Next.js Server Actions for AI](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

**Security Best Practices:**
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Vercel Environment Variables Security](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Appendix: Competitive Analysis

| Product | AI Integration | Pricing | BYOK? | Notes |
|---------|---------------|---------|-------|-------|
| **Linear** | Platform AI | Included in Pro ($10/user/mo) | No | Simple, not customizable |
| **Notion** | Hybrid | $10/user/mo add-on OR BYOK | Yes | Best-in-class hybrid model |
| **ClickUp** | Platform AI | $5/user/mo add-on | No | Basic features, slow |
| **Asana** | Platform AI | Enterprise only | No | Limited capabilities |
| **Cohortix** | **BYOK → Hybrid** | **Free (BYOK) → $2/mo (platform)** | **Yes** | **Unique: OpenClaw integration** |

**Competitive Advantage:**
- Only PM tool with native OpenClaw agent support
- BYOK option targets cost-conscious AI teams
- Phased approach = faster MVP than building all at once

---

## Approval & Sign-Off

**Recommended Decision:** ✅ **Option D: Hybrid (BYOK + Platform AI + OpenClaw)**

**Rationale:** Balances immediate market fit with long-term growth potential. Phased rollout reduces risk while maintaining optionality.

**Requested Approvals:**

- [ ] **Ahmad (CEO)** — Strategic direction, business model
- [ ] **Idris (Architect)** — Technical feasibility, security review
- [ ] **Alim (CEO Operations)** — Resource allocation, timeline
- [ ] **Finance** — Cost projections, pricing strategy (if applicable)

**Next Steps:**
1. CEO approval on hybrid approach
2. Architect review of security implementation (API key encryption)
3. Engineering estimate for Phase 1 (BYOK)
4. Design mockups for AI settings UI (Lubna)
5. Schedule kickoff meeting

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-14  
**Status:** Awaiting approval

---

*This ADR follows the Cohortix Architecture Decision Record standards based on existing DDR templates and ARCHITECTURAL_DECISIONS.md patterns.*
