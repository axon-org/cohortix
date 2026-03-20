# Security & Responsible Disclosure

<!-- Purpose: Security policy and vulnerability reporting for Cohortix -->
<!-- Owner: Team -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: CONTRIBUTING.md -->

Cohortix is MIT-licensed open-source software.

## Reporting Vulnerabilities

Please report security issues to **security@cohortix.dev** (or open a private security advisory on GitHub).

We follow a 90-day coordinated disclosure policy.

## Security Practices
- Built-in role-based access control (viewer, operator, admin)
- Session + API key authentication
- CSRF protection
- Rate limiting
- Content Security Policy with per-request nonces
- Webhook signature verification (HMAC-SHA256)
