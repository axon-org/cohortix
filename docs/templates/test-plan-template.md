#### 6.4.2 Test Plan File Format

```markdown
# Test Plan: [Feature Name]

<!-- Purpose: [Why this doc exists] -->
<!-- Owner: @[agent-or-human] -->
<!-- Last Reviewed: YYYY-MM-DD -->
<!-- Read After: [prerequisite doc path] -->

> **Purpose:** Define test strategy and coverage for a feature
> **Owner:** @[qa-agent]
> **Last Reviewed:** YYYY-MM-DD
> **Read After:** Relevant feature spec

**Created:** YYYY-MM-DD
**Status:** Draft | In Progress | Complete

## Scope
[What is being tested]

## Test Cases

### Unit Tests
- [ ] Test case 1: [Description]
- [ ] Test case 2: [Description]

### Integration Tests
- [ ] Integration scenario 1: [Description]

### E2E Tests
- [ ] User flow 1: [Description]

### Security Tests
- [ ] Input validation
- [ ] Authentication/authorization

### Performance Tests
- [ ] Load test: [Criteria]

## Test Data
[Mock data, fixtures, test accounts needed]

## Results
- Tests passed: X / Y
- Coverage: Z%
- Issues found: [Link to issue tracker]

## Sign-Off
- [ ] All tests passed
- [ ] Coverage meets requirements (80%+)
- [ ] No critical issues
```
