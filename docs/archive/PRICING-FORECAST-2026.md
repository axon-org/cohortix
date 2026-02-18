# Cohortix Pricing & Package Forecast 2026

**Date:** 2026-02-17  
**Prepared by:** Malik (Revenue Architect)  
**Version:** 1.0  
**Status:** Draft for Review

---

## Executive Summary

Cohortix is positioned at the intersection of three high-growth markets: AI
agents ($15B+ by 2028), productivity SaaS ($100B+), and creator economies
($250B+). Based on competitive analysis and unit economics modeling, we
recommend a **hybrid pricing model** combining:

1. **Subscription tiers** for platform access (Free/Starter/Pro/Enterprise)
2. **Usage-based credits** for agent execution
3. **Marketplace commission** (15-20%) on creator-to-consumer agent rentals

**Key Findings:**

- AI-native SaaS platforms show 50-65% gross margins (vs. 70-85% traditional
  SaaS)
- Market standard: 3-tier pricing converts 27-40% better than 4+ tiers
- Optimal commission rate: 15-20% balances creator incentive with platform
  sustainability
- Break-even: ~350 paying users on Pro tier or 150 Enterprise customers

**Recommended Launch Strategy:**

- Free tier: 1 agent, 500 credits/month (generous but gated)
- Starter: $29/mo — 3 agents, 5,000 credits
- Pro: $99/mo — 10 agents, 25,000 credits, marketplace access
- Enterprise: $499/mo — Unlimited agents, custom credits, dedicated support

---

## 1. Competitive Pricing Landscape

### 1.1 Direct AI Agent Platform Competitors

| Platform         | Free Tier      | Starter                     | Growth                         | Enterprise             | Model              | Notes                            |
| ---------------- | -------------- | --------------------------- | ------------------------------ | ---------------------- | ------------------ | -------------------------------- |
| **Relevance AI** | 200 credits    | $19/mo (10K credits)        | $199/mo (100K credits)         | $599/mo (300K credits) | Credit-based       | 1 user on Starter, 10 on Team    |
| **Lindy AI**     | 400 credits    | $49.99/mo (5K credits)      | $299.99/mo (30K credits)       | Custom                 | Credit-based       | Per action consumption varies    |
| **Bland AI**     | Limited        | $49/mo (160 mins)           | $299/mo (2K calls/day)         | $499+/mo               | Usage + Sub        | Voice agents, per-minute pricing |
| **CrewAI**       | 50 executions  | $25/mo                      | $1,000/mo (2K executions)      | $60K+/yr               | Execution-based    | Open source + hosted tiers       |
| **Voiceflow**    | 100K tokens    | $50/mo (4M tokens)          | $125/mo (20M tokens)           | Custom                 | Token-based        | Conversational AI focus          |
| **Gumloop**      | 2,000 credits  | $37/mo (10K credits)        | $244/mo (60K credits)          | Custom                 | Credit-based       | No-code automation               |
| **Relay.app**    | 500 credits    | $38/mo (5K credits, 1 seat) | $138/mo (5K credits, 10 seats) | Custom                 | Per-seat + Credits | Workflow automation              |
| **n8n Cloud**    | Self-host free | $20/mo (2.5K executions)    | $50/mo (10K executions)        | $667/mo                | Execution-based    | Open core model                  |
| **Make**         | 1,000 ops      | $9/mo (10K ops)             | $16/mo (10K ops)               | Custom                 | Operation-based    | Visual automation                |
| **Zapier**       | 100 tasks      | $19.99/mo (750 tasks)       | $69/mo (2K tasks)              | Custom                 | Task-based         | Industry incumbent               |

### 1.2 Marketplace/Platform Commission Benchmarks

| Platform              | Commission             | Revenue Split           | Notes                             |
| --------------------- | ---------------------- | ----------------------- | --------------------------------- |
| **OpenAI GPT Store**  | Revenue share          | Engagement-based payout | Exact % not public                |
| **Shopify App Store** | 0% first $1M, then 15% | 100%/85% developer      | Developer-friendly model          |
| **AppSumo**           | 60-70%                 | 30-40% creator          | High marketing cost justification |
| **Apple App Store**   | 15-30%                 | 70-85% developer        | Standard digital marketplace      |
| **Google Play**       | 15-30%                 | 70-85% developer        | Reduced to 15% under $1M          |
| **Hugging Face**      | 10-20%                 | 80-90% creator          | AI model marketplace              |
| **Replicate**         | 10-20%                 | 80-90% creator          | AI/ML model hosting               |
| **Fiverr**            | 20%                    | 80% freelancer          | Service marketplace               |
| **Upwork**            | 5-20%                  | 80-95% freelancer       | Sliding scale                     |
| **AWS Marketplace**   | 5-20%                  | 80-95% seller           | B2B software focus                |

### 1.3 Key Competitive Insights

1. **Credit-Based Dominance:** 66% of AI platforms use usage-based pricing
   (credits/tokens/executions) to align with variable inference costs
2. **Free Tier Expectations:** 400-2,000 credits/month is standard for free
   tiers
3. **Price Anchoring:** Starter tiers cluster at $20-50/mo, Growth at
   $100-300/mo
4. **Enterprise Floor:** $500+/mo is the psychological floor for "Enterprise"
   labeling
5. **Commission Sweet Spot:** 15-20% is the creator-friendly zone; above 30%
   faces resistance

---

## 2. Unit Economics Breakdown

### 2.1 Cost Structure (From Stack Analysis)

#### Infrastructure Costs (Fixed)

| Tier           | Monthly Range    | Assumptions                            |
| -------------- | ---------------- | -------------------------------------- |
| **Bootstrap**  | $120-350/mo      | Current stack + Mem0, minimal Qdrant   |
| **Growth**     | $700-2,000/mo    | Qdrant production, Mem0 Pro, LiteLLM   |
| **Enterprise** | $2,500-8,000+/mo | HA setup, dedicated shards, compliance |

#### LLM Costs (Variable)

| Tier           | Monthly Range | Per-Execution Estimate                 |
| -------------- | ------------- | -------------------------------------- |
| **Bootstrap**  | $100-500/mo   | ~$0.005-0.02 per agent interaction     |
| **Growth**     | $500-3,000/mo | ~$0.01-0.05 per complex agent run      |
| **Enterprise** | $3,000+/mo    | Custom model routing, volume discounts |

#### Blended Cost Per User

| Component             | Bootstrap    | Growth        | Enterprise    |
| --------------------- | ------------ | ------------- | ------------- |
| Infra (allocated)     | $15/user     | $25/user      | $100/user     |
| LLM (at median usage) | $25/user     | $75/user      | $200/user     |
| **Total COGS**        | **$40/user** | **$100/user** | **$300/user** |

### 2.2 Cost Per Agent Instance

| Cost Driver                | Per Hour          | Per Conversation              | Notes                       |
| -------------------------- | ----------------- | ----------------------------- | --------------------------- |
| **Compute**                | $0.02-0.10        | $0.001-0.005                  | Container/runtime costs     |
| **Vector DB (Qdrant)**     | $0.01-0.05        | $0.0005-0.002                 | Retrieval + storage         |
| **Graph DB (NebulaGraph)** | $0.02-0.08        | $0.001-0.004                  | Relationship queries        |
| **LLM Tokens**             | Variable          | $0.01-0.20                    | Depends on model/complexity |
| **Mem0 Storage**           | $0.005-0.02       | $0.0005-0.002                 | Memory persistence          |
| **Total Per Agent**        | **$0.05-0.45/hr** | **$0.013-0.213/conversation** | Range based on complexity   |

**Average Cost per Agent Execution:** $0.03-0.08 (assuming 5-10 min
conversations)

### 2.3 Cost Per Tenant (Isolation Overhead)

| Isolation Tier                 | Monthly Overhead | Use Case                    |
| ------------------------------ | ---------------- | --------------------------- |
| **Tier A (Shared)**            | $0-5             | Namespace/payload filtering |
| **Tier B (Dedicated Shard)**   | $50-150          | Premium tenants             |
| **Tier C (Dedicated Cluster)** | $500-2,000       | Enterprise/compliance       |

### 2.4 Cost Per Creator (Knowledge Storage + Processing)

| Component                      | Cost               | Notes                        |
| ------------------------------ | ------------------ | ---------------------------- |
| **Knowledge Storage**          | $0.50-2/GB/mo      | Qdrant + NebulaGraph         |
| **Processing (Ingestion)**     | $0.01-0.10/doc     | Embedding + graph extraction |
| **Memory Writes**              | $0.001-0.005/write | Mem0 persistence             |
| **Monthly per Active Creator** | $5-50              | Depends on knowledge volume  |

### 2.5 Break-Even Analysis

| Metric                    | 100 Users | 500 Users | 1,000 Users | 5,000 Users |
| ------------------------- | --------- | --------- | ----------- | ----------- |
| **Avg Revenue/User**      | $45       | $45       | $45         | $40         |
| **Total Revenue**         | $4,500    | $22,500   | $45,000     | $200,000    |
| **Infra Cost**            | $350      | $1,200    | $2,500      | $8,000      |
| **LLM Cost**              | $2,500    | $12,500   | $25,000     | $100,000    |
| **Total COGS**            | $2,850    | $13,700   | $27,500     | $108,000    |
| **Gross Profit**          | $1,650    | $8,800    | $17,500     | $92,000     |
| **Gross Margin**          | 37%       | 39%       | 39%         | 46%         |
| **Operating Expenses\* ** | $10,000   | $15,000   | $25,000     | $75,000     |
| **Net Profit**            | ($8,350)  | ($6,200)  | ($7,500)    | $17,000     |

\*Est. engineering, support, marketing, overhead

**Break-even point:** ~3,500-4,000 paying users OR ~1,000 Pro/Enterprise users
OR marketplace commission revenue of $15K+/mo

---

## 3. Recommended Pricing Packages

### 3.1 Consumer-Facing Tiers (Agent Renters)

| Feature                       | **Free**       | **Starter**           | **Pro**           | **Enterprise**      |
| ----------------------------- | -------------- | --------------------- | ----------------- | ------------------- |
| **Price**                     | $0             | $29/mo                | $99/mo            | $499/mo             |
| **Annual Price**              | $0             | $290/yr (17% off)     | $990/yr (17% off) | $4,990/yr (17% off) |
| **Agents**                    | 1              | 3                     | 10                | Unlimited           |
| **Credits/Month**             | 500            | 5,000                 | 25,000            | Custom              |
| **Knowledge Storage**         | 100 MB         | 500 MB                | 2 GB              | 10 GB+              |
| **Agent Types**               | Pre-built only | Pre-built + Community | All + Marketplace | All + Custom        |
| **Concurrent Runs**           | 1              | 2                     | 5                 | Unlimited           |
| **API Access**                | ❌             | ❌                    | ✅                | ✅                  |
| **Priority Support**          | ❌             | ❌                    | ✅                | Dedicated           |
| **SSO/SAML**                  | ❌             | ❌                    | ❌                | ✅                  |
| **SLA**                       | ❌             | ❌                    | ❌                | 99.9%               |
| **Custom Models**             | ❌             | ❌                    | ❌                | ✅                  |
| **Margin at 70% Utilization** | N/A            | 65%                   | 72%               | 78%                 |

**Credit Consumption Guidelines:**

- Simple task/query: 1 credit
- Multi-step agent execution: 5-10 credits
- Complex cohort coordination: 20-50 credits
- Knowledge ingestion (per doc): 2-5 credits

### 3.2 Creator-Facing Tiers (Agent Builders)

| Feature                   | **Hobby** | **Creator**        | **Studio**         | **Enterprise**     |
| ------------------------- | --------- | ------------------ | ------------------ | ------------------ |
| **Price**                 | $0        | $49/mo             | $199/mo            | $999/mo            |
| **Agents Created**        | 1         | 5                  | 25                 | Unlimited          |
| **Knowledge Storage**     | 500 MB    | 2 GB               | 10 GB              | 50 GB+             |
| **Cohort Protocols**      | ❌        | 1                  | 5                  | Unlimited          |
| **Marketplace Listing**   | ❌        | ✅ Basic           | ✅ Featured        | ✅ Premium         |
| **Commission Rate**       | N/A       | 85% (15% platform) | 85% (15% platform) | 80% (20% platform) |
| **Analytics**             | Basic     | Standard           | Advanced           | Custom             |
| **API Rate Limits**       | 100/day   | 1,000/day          | 10,000/day         | Unlimited          |
| **White-label**           | ❌        | ❌                 | ❌                 | ✅                 |
| **Revenue Share Example** | N/A       | $85 on $100 sale   | $85 on $100 sale   | $80 on $100 sale   |

### 3.3 Marketplace Commission Structure

| Transaction Type                   | Platform Fee | Creator Receives | Notes                   |
| ---------------------------------- | ------------ | ---------------- | ----------------------- |
| **Agent Rental (per-use)**         | 15%          | 85%              | One-time usage fee      |
| **Agent Subscription (monthly)**   | 15%          | 85%              | Recurring revenue       |
| **Cohort Rental**                  | 15%          | 85%              | Multi-agent team        |
| **Enterprise Custom Deal**         | 20%          | 80%              | Higher touch support    |
| **Creator Referral (bring buyer)** | 5%           | 95%              | Incentive for marketing |

**Why 15%?**

- Below AppSumo (60-70%) and Apple (30%) — creator-friendly
- Above Shopify (0% first $1M) but aligned with Hugging Face (10-20%)
- Sustainable for platform operations (payment processing: 3%, infrastructure:
  5%, profit: 7%)

### 3.4 Feature Comparison Matrix

| Capability               | Free   | Starter | Pro    | Enterprise |
| ------------------------ | ------ | ------- | ------ | ---------- |
| **Core Platform**        |
| Mission Control Access   | ✅     | ✅      | ✅     | ✅         |
| Kanban/Calendar Views    | ✅     | ✅      | ✅     | ✅         |
| Knowledge Base (Limited) | ✅     | ✅      | ✅     | ✅         |
| Multi-tenant Isolation   | Tier A | Tier A  | Tier B | Tier C     |
| **Agent Access**         |
| Pre-built Agents         | 3      | All     | All    | All        |
| Community Agents         | ❌     | ✅      | ✅     | ✅         |
| Premium Agents           | ❌     | ❌      | ✅     | ✅         |
| Custom Agent Build       | ❌     | ❌      | ❌     | ✅         |
| **Execution**            |
| Credits/Month            | 500    | 5,000   | 25,000 | Unlimited  |
| Credit Top-ups           | ❌     | ✅      | ✅     | ✅         |
| Concurrent Agents        | 1      | 2       | 5      | Unlimited  |
| Priority Queue           | ❌     | ❌      | ✅     | ✅         |
| **Integration**          |
| Slack/Discord            | ❌     | ✅      | ✅     | ✅         |
| API Access               | ❌     | ❌      | ✅     | ✅         |
| Webhooks                 | ❌     | ❌      | ✅     | ✅         |
| Custom Integrations      | ❌     | ❌      | ❌     | ✅         |
| **Support**              |
| Community Support        | ✅     | ✅      | ✅     | ✅         |
| Email Support            | ❌     | ✅      | ✅     | ✅         |
| Priority Support         | ❌     | ❌      | ✅     | ✅         |
| Dedicated Success        | ❌     | ❌      | ❌     | ✅         |
| SLA                      | ❌     | ❌      | ❌     | 99.9%      |

---

## 4. Revenue Forecast Model

### 4.1 Assumptions

| Metric                        | Conservative | Moderate | Aggressive |
| ----------------------------- | ------------ | -------- | ---------- |
| **User Acquisition**          |
| Monthly New Users (Free)      | 500          | 1,000    | 2,500      |
| Free-to-Paid Conversion       | 3%           | 5%       | 8%         |
| **Churn**                     |
| Monthly Churn (Starter)       | 8%           | 5%       | 4%         |
| Monthly Churn (Pro)           | 5%           | 3%       | 2%         |
| Monthly Churn (Enterprise)    | 3%           | 2%       | 1%         |
| **Expansion**                 |
| Upgrade Rate (Starter→Pro)    | 10%          | 15%      | 20%        |
| Upgrade Rate (Pro→Enterprise) | 5%           | 8%       | 12%        |
| **Marketplace**               |

| % Users as Creat
