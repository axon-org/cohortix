# Cohortix Stack Gap Analysis & Cost Breakdown (2026)

**Date:** 2026-02-17  
**Prepared by:** AI Developer Specialist (Devi)  
**Scope:** Current Cohortix stack vs proposed knowledge infrastructure (Qdrant + NebulaGraph + Mem0 + upgraded QMD), fit assessment, cost tiers, and phased implementation priorities.

---

## Executive Summary

Cohortix’s current stack (Next.js + Supabase + Vercel + Drizzle, with Clerk now replacing Supabase Auth in practice) is strong for MVP delivery of Mission Control, multi-tenant workflow, and baseline semantic search via pgvector, but it is **not yet sufficient** for marketplace-scale agent memory and relationship-aware retrieval. The recommended knowledge stack (Qdrant + NebulaGraph + Mem0 + upgraded QMD) is directionally correct for v3/marketplace goals, but deploying all of it immediately would be overkill for MVP. The best path is **phased adoption**: keep current stack for core product launch, add Mem0 + retrieval upgrades first, then introduce Qdrant, and defer NebulaGraph until graph-specific retrieval pain appears in production.

---

## 1) Current Stack Inventory (What Cohortix already has)

> Sources: `PRD.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_DESIGN.md`, `TECH_STACK.md`, `CLERK-MIGRATION-SUMMARY.md`, `ARCHITECTURAL_DECISIONS.md`

| Layer | Current State | Status | Notes |
|---|---|---|---|
| Frontend | Next.js 15 + React 19 + Tailwind/shadcn | ✅ In place | Matches PRD constraints |
| API/BFF | Next.js route handlers + service layer pattern | ✅ Designed / partially implemented | Good for MVP speed |
| Primary DB | Supabase PostgreSQL | ✅ In place | RLS strategy documented |
| Vector Search | pgvector in Supabase | ✅ In place | Adequate for MVP scale |
| Auth | **Clerk migrated in code** (from Supabase Auth) | ✅ Recently migrated | Important architecture drift from original PRD |
| Realtime | Supabase Realtime | ✅ In place | Supports mission/activity live updates |
| File Storage | Supabase Storage / Blob strategy | ✅ In place | Sufficient for MVP |
| Queue/Workers | Inngest planned | 🟡 Partial | Needed for background workflows |
| Agent Runtime | Clawdbot adapter + runtime abstraction | 🟡 Transitional | v1 still external-runtime dependent |
| Knowledge Graph | Postgres tables/relationships (JSONB + FK pattern) | 🟡 Basic only | No dedicated graph engine |
| LLM Routing | No robust gateway baseline | 🔴 Gap | LiteLLM not fully institutionalized yet |
| Cost tracking | Schema decision approved | 🟡 Partial | Critical for marketplace billing later |

---

## 2) Gap Analysis (Have vs Need)

> Sources: `KNOWLEDGE-INFRA-RESEARCH-2026.md`, `V3-TECH-STACK-RESEARCH.md`, `KNOWLEDGE-INFRA-RESEARCH.md`

| Capability Needed (Marketplace/Future) | Current | Recommended | Gap Severity | Add Now? |
|---|---|---|---|---|
| High-scale vector memory (tenant-aware) | pgvector only | Qdrant | High | **Yes (Phase 1/2)** |
| Relationship-aware retrieval (GraphRAG) | Postgres relationship tables | NebulaGraph | Medium-High | **Later (Phase 3)** |
| Agent memory abstraction (dedup/evolution) | Ad hoc + local patterns | Mem0 | High | **Yes (Phase 1)** |
| Unified retrieval pipeline | Basic semantic + SQL | QMD v2: BM25 + dense + graph + rerank | High | **Yes (Phase 1)** |
| Strong tenant isolation tiers | RLS baseline | Tier A/B/C isolation policy | High | **Yes (Phase 1 design)** |
| LLM routing and cost controls | Limited | LiteLLM gateway + budgets | Medium | **Yes (Phase 1/2)** |
| Agent-to-agent infra scale | Transitional | NATS + runtime maturity | Medium | **Later (post-MVP)** |
| Full marketplace billing intelligence | Partial schema plans | per-agent/per-tenant infra + LLM cost tracking | High | **Phase 2** |

---

## 3) Fit Evaluation: Is the Recommended Stack Right?

### What makes strong sense
- **Mem0** fits immediately: aligns with ongoing OpenClaw usage, improves memory quality, and lowers token/context waste.
- **Qdrant** is the right vector upgrade path from pgvector for marketplace-level throughput and tenancy scaling.
- **QMD upgrade** (hybrid retrieval + reranking) is highly aligned with PRD goals around fast, contextual knowledge recall.

### What is likely overkill *right now*
- **NebulaGraph on day one MVP**: PRD MVP does not require advanced graph traversal UI or deep multi-hop reasoning as a launch blocker.
- **Full “all-services-at-once” v3 infra rollout** before proving core marketplace demand and retrieval bottlenecks.

### Simpler MVP/Beta alternative
For MVP/beta, use:
1. Supabase Postgres + pgvector (existing)
2. Mem0 memory layer
3. Upgraded QMD retrieval stack (BM25 + dense + reranker)
4. LiteLLM gateway for model routing/cost caps

Then add Qdrant once either:
- search latency/relevance degrades at scale, or
- tenant volume starts stressing pgvector and RLS query paths.

---

## 4) Cost Breakdown (Current + Additional)

## Assumptions used
- Region pricing approximated from referenced docs (2025–2026 ranges)
- LLM token spend shown separately where relevant
- Bandwidth assumes moderate API/web traffic, not heavy media streaming
- “Current” reflects documented architecture + Clerk migration status

### 4.1 Current Monthly Cost (what’s already running)

| Component | Current Est. Monthly |
|---|---:|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Upstash Redis (or equivalent light cache) | $0–$10 |
| Inngest (early usage) | $0–$20 |
| Sentry/Monitoring baseline | $0–$26 |
| Clerk (if > free thresholds) | $0–$25+ |
| **Current baseline total** | **~$45–$126/mo** |

> If still within Clerk/Sentry/Inngest free tiers: practical baseline is often **~$45–$60/mo**.

---

### 4.2 Additional Cost for New Knowledge Infra

#### A) Self-hosted (Mac Mini / VPS biased)
| Component | Bootstrap | Growth | Enterprise-ready |
|---|---:|---:|---:|
| Qdrant | $0–$50 (self-host/free tier) | $80–$200 | $300–$700 |
| NebulaGraph | $0–$60 (single node) | $100–$250 (HA-ish) | $300–$900 |
| Mem0 | $19–$49 | $99–$249 | $500+ (enterprise) |
| LiteLLM gateway | $10–$30 | $30–$80 | $80–$200 |
| Observability/backups | $20–$50 | $80–$200 | $200–$600 |
| **Additional infra subtotal** | **$49–$239** | **$389–$979** | **$1,380–$2,900+** |

#### B) Managed services biased
| Component | Bootstrap | Growth | Enterprise-ready |
|---|---:|---:|---:|
| Qdrant Cloud | $30–$120 | $150–$400 | $500–$1,000+ |
| NebulaGraph managed / alt managed graph | $100–$250 | $250–$700 | $800–$2,000+ |
| Mem0 Cloud | $19–$49 | $249 | $500–$1,500+ |
| LiteLLM host (managed VM) | $20–$50 | $50–$120 | $150–$400 |
| Monitoring + backup + security tooling | $40–$120 | $120–$350 | $400–$1,200 |
| **Additional infra subtotal** | **$209–$589** | **$819–$1,819** | **$2,350–$6,100+** |

---

### 4.3 Total Monthly by Tier (Current + New Infra)

| Tier | Infra Strategy | Monthly (Excl. LLM API tokens) | Typical Compute/Storage/Bandwidth Envelope |
|---|---|---:|---|
| **Bootstrap** | Current stack + Mem0 + retrieval upgrades, minimal Qdrant | **~$120–$350** | 2–4 vCPU total, 8–16GB RAM, 50–200GB storage, 0.5–2TB egress |
| **Growth** | Qdrant production + Mem0 Pro + LiteLLM + optional graph pilot | **~$700–$2,000** | 8–16 vCPU, 32–64GB RAM, 0.5–2TB storage, 2–8TB egress |
| **Enterprise-ready** | Dedicated isolation tiers + Qdrant+Graph HA + strict ops/security | **~$2,500–$8,000+** | 24+ vCPU, 96GB+ RAM, multi-TB storage, 8TB+ egress |

### 4.4 LLM Spend (separate but critical)
- Bootstrap: ~$100–$500/mo
- Growth: ~$500–$3,000/mo
- Enterprise: $3,000+/mo (highly workload dependent)

---

## 5) Implementation Roadmap (Phased Priorities)

## Phase 0 (Now, 1–2 weeks): Lock architecture + observability baselines
- Finalize canonical auth architecture (Clerk + Supabase role model)
- Add strict tenant-context middleware everywhere
- Implement cost attribution schema and dashboards (per tenant/agent)

## Phase 1 (Highest impact, lowest effort: 2–4 weeks)
**Must-have before scale:**
1. Integrate **Mem0** for agent memory quality + dedup
2. Upgrade **QMD** to hybrid retrieval (BM25 + dense + rerank)
3. Add **LiteLLM** gateway for routing/fallback/cost controls
4. Add retrieval quality eval harness (precision/latency/cost metrics)

## Phase 2 (Pre-marketplace beta: 4–8 weeks)
1. Introduce **Qdrant** (tenant-aware collections/partitions)
2. Migrate hot retrieval workloads off pgvector where needed
3. Implement Tier A/B tenant isolation (shared + dedicated shard paths)
4. Add migration tooling between tenant tiers

## Phase 3 (Post-MVP / scaling inflection)
1. Add **NebulaGraph** for graph expansion in retrieval
2. Enable graph-aware recommendation/knowledge linking use cases
3. Introduce enterprise Tier C (dedicated DB/cluster)

## Phase 4 (Marketplace maturity)
- Creator-owned agent knowledge spaces
- Cohort-level shared memory contracts
- Billing hooks for memory writes/storage/retrieval

---

## 6) Must-have vs Nice-to-have for Marketplace Use Case

### Must-have (before meaningful marketplace scale)
- Tenant-safe memory boundaries
- Cost tracking per tenant/agent
- Hybrid retrieval quality (not just raw vector similarity)
- Reliable LLM routing and failover
- Qdrant-grade vector scalability (or clear trigger criteria to move)

### Nice-to-have (post-MVP)
- Full GraphRAG with dedicated graph DB
- Advanced memory decay automation
- Dedicated per-tenant cluster provisioning automation
- Multi-region active-active knowledge planes

---

## Final Recommendation

**Is this the right stack?**  
**Yes, with sequencing changes.**

The target stack (Qdrant + NebulaGraph + Mem0 + upgraded QMD) is strategically correct for Cohortix’s long-term marketplace and agent-rental vision. However, implementing all components immediately is unnecessary risk/cost for MVP. The best approach is:

1. **Adopt now:** Mem0 + upgraded QMD + LiteLLM + tenant governance + cost tracking  
2. **Adopt next:** Qdrant for production vector scaling  
3. **Defer until proven need:** NebulaGraph (activate when relationship-aware retrieval materially impacts outcomes)

This preserves velocity, controls burn, and keeps architectural alignment with the PRD and v3 ambitions.

---

## Appendix: Notable Documentation Drift to Resolve

1. **Auth drift:** PRD/older architecture references Supabase Auth, while migration docs show Clerk is now primary.
2. **Terminology drift:** goals/missions/actions naming still mixed across API/schema docs.
3. **Infra drift:** some docs assume Neon, others Supabase; standardize one canonical architecture doc.
4. **Graph position drift:** some decisions skip dedicated graph DB for MVP; newer research recommends Nebula/Falkor for scale.

**Action:** Publish one “source of truth” architecture baseline before implementation work begins.
