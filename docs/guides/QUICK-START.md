# Quick Start

<!-- Purpose: Quick start guide for setting up Cohortix locally -->
<!-- Owner: Team -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: README.md -->

## Local Development

```bash
git clone https://github.com/axon-org/cohortix.git
cd cohortix
pnpm install
pnpm dev
```

Open http://localhost:3000/setup in your browser to create your admin account.

## Docker

```bash
git clone https://github.com/axon-org/cohortix.git
cd cohortix
docker compose up -d
```

Visit http://localhost:3000 to get started.

## Requirements
- Node.js 22.x (LTS) or 24.x
- pnpm (auto-installed via corepack if missing)
