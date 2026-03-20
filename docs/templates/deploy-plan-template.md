#### 6.4.3 Deployment Document Format

```markdown
# Deployment: [Feature Name]

<!-- Purpose: [Why this doc exists] -->
<!-- Owner: @[agent-or-human] -->
<!-- Last Reviewed: YYYY-MM-DD -->
<!-- Read After: [prerequisite doc path] -->

> **Purpose:** Plan and track deployment of a feature to production
> **Owner:** @[devops-agent]
> **Last Reviewed:** YYYY-MM-DD
> **Read After:** Relevant feature spec

**Created:** YYYY-MM-DD
**Status:** Draft | Staged | Deployed

## Environment Requirements
- New environment variables: [List with formats, not values]
- New dependencies: [List with versions]
- Infrastructure changes: [Compute, storage, network]

## Deployment Steps
1. [Step 1 with exact commands]
2. [Step 2]

## Rollback Plan
1. [Rollback step 1]
2. [Rollback step 2]

## Verification
- [ ] Health check passes (`curl /health`)
- [ ] Key metrics normal (dashboard link)
- [ ] No errors in logs (`grep ERROR`)

## Monitoring
- Dashboard: [Link]
- Alerts configured: [List]

## Sign-Off
- [ ] Deployed to staging
- [ ] Verified in staging (24h observation)
- [ ] Deployed to production
- [ ] Post-deploy verification complete
```

### 6.5 Communication Channel Standards
