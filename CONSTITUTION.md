# Cohortix Constitution

> Based on the Axon Codex default preset. Foundational principles that guide all
> technical decisions in this project. Override specific Codex defaults by
> editing this file per project.

---

## Core Principles

### 1. Security First

- No secrets in code — use environment variables
- Validate all inputs at API boundaries
- Apply principle of least privilege for all access
- Dependencies must be audited before adoption
- OWASP Top 10 compliance is mandatory

### 2. Type Safety

- TypeScript strict mode enabled (`strict: true`)
- No `any` types in production code (use `unknown` + type guards)
- All API responses typed with Zod or equivalent runtime validation
- Database queries return typed results (Drizzle ORM or equivalent)

### 3. Test Coverage

- Minimum 70% code coverage for new code
- All API endpoints have integration tests
- All business logic has unit tests
- Critical paths have E2E tests
- Test pyramid: 70% unit / 20% integration / 10% E2E

### 4. Accessibility

- WCAG 2.2 AA compliance minimum
- All interactive elements keyboard-navigable
- All images have alt text
- Color contrast ratios meet AA standards
- Screen reader testing for critical flows

### 5. Performance

- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1
- Bundle size budgets enforced per route
- Images optimized and lazy-loaded
- Database queries < 100ms for common operations
- API responses < 500ms p95

### 6. Code Quality

- No dead code — remove unused imports, functions, variables
- DRY within reason — don't abstract prematurely
- Single responsibility per file/function
- Clear naming over clever naming
- Comments explain WHY, not WHAT

### 7. Documentation

- All public APIs documented
- README.md required per package/app
- ADRs for significant architectural decisions
- Inline JSDoc for complex functions
- CHANGELOG.md maintained per release

### 8. Error Handling

- Never swallow errors silently
- User-facing errors are helpful and actionable
- System errors logged with context (request ID, user ID, stack trace)
- Graceful degradation over hard failures
- Circuit breakers for external service calls

---

## How to Customize

Copy this file to your project root as `CONSTITUTION.md` and modify:

```bash
cp docs/dev-codex/constitution/default.md CONSTITUTION.md
```

Then reference it in your `CLAUDE.md`:

```markdown
## Project Constitution

Read and follow: CONSTITUTION.md
```

Any principle here can be relaxed or tightened per project needs.
