# File Cleanup Review - Cohortix

This document summarizes unused files, orphaned assets, and placeholder files
identified for potential cleanup.

**Date:** 2026-02-20 **Branch:** `dev`

---

## Summary of Findings

| Category                            | Count | Total Disk Space |
| :---------------------------------- | :---- | :--------------- |
| 🟢 Safe to delete                   | 28    | ~100 KB          |
| 🟡 Human decision (Orphaned Assets) | 29    | ~9.6 MB          |
| 🔴 Keep (False Positives)           | 28    | N/A              |

---

## 🟢 Safe to delete

These files have no internal references and are not standard configuration or
Next.js convention files.

### Unused Source/Script Files

| File Path                                                  | Size | Reason                              |
| :--------------------------------------------------------- | :--- | :---------------------------------- |
| `apps/web/e2e/login-helper.ts`                             | 821B | No references found.                |
| `apps/web/src/components/cohorts/cohort-detail-client.tsx` | 4.1K | No references found.                |
| `apps/web/src/components/cohorts/cohort-modal.tsx`         | 8.1K | No references found.                |
| `packages/database/src/schema/debriefs.ts`                 | 3.0K | No references found.                |
| `packages/database/src/schema/intelligence.ts`             | 2.5K | No references found.                |
| `scripts/apply-cohorts-migrations.ts`                      | 3.4K | Migration helper (likely one-time). |
| `scripts/apply-migration-0003.ts`                          | 1.3K | One-time migration script.          |
| `scripts/apply-migration-0005.ts`                          | 1.7K | One-time migration script.          |
| `scripts/apply-migration.ts`                               | 2.7K | One-time migration script.          |
| `scripts/apply-with-postgres.ts`                           | 2.7K | One-time migration script.          |
| `scripts/check-data.ts`                                    | 1.9K | Debugging script.                   |
| `scripts/create-test-user.ts`                              | 4.0K | Debugging script.                   |
| `scripts/debug-schema.ts`                                  | 1.2K | Debugging script.                   |
| `scripts/direct-migrate.ts`                                | 1.9K | One-time migration script.          |
| `scripts/enable-extensions.ts`                             | 2.0K | Database setup script.              |
| `scripts/inspect-cohorts.ts`                               | 895B | Debugging script.                   |
| `scripts/quick-seed-cohorts.ts`                            | 2.9K | Seeding script.                     |
| `scripts/run-migration-api.ts`                             | 2.4K | One-time migration script.          |
| `scripts/run-migration.ts`                                 | 2.3K | One-time migration script.          |
| `scripts/seed-audit-logs.ts`                               | 4.5K | Seeding script.                     |
| `scripts/seed-cohort-members.ts`                           | 13K  | Seeding script.                     |
| `scripts/seed-ppv-hierarchy.ts`                            | 12K  | Seeding script.                     |
| `scripts/seed-supabase.ts`                                 | 15K  | Seeding script.                     |
| `scripts/test-supabase-connection.ts`                      | 2.9K | Connection test script.             |
| `scripts/verify-cohort-data.ts`                            | 3.3K | Verification script.                |
| `scripts/verify-connection.ts`                             | 1.2K | Verification script.                |
| `scripts/verify-seed.ts`                                   | 2.9K | Verification script.                |
| `scripts/verify-unified-seed.ts`                           | 4.0K | Verification script.                |

---

## 🟡 Human decision (Design Assets & Docs)

These files are not referenced in the code but may be valuable for documentation
or design reference.

### Orphaned Large Assets (>100KB)

| File Path                                                 | Size  | Category      |
| :-------------------------------------------------------- | :---- | :------------ |
| `./mockups/FINAL_04_knowledge_base_interface.png`         | 4.5M  | Design Mockup |
| `./mockups/stitch-2026-02-10/00-all-screens-overview.png` | 228K  | Design Mockup |
| `./mockups/v3/04-ally-profile-linear-dark.png`            | 209K  | Design Mockup |
| `... (26 other mockup/design assets)`                     | ~4.7M | Design/Docs   |

### Documentation Scripts

| File Path                                       | Size | Reason                   |
| :---------------------------------------------- | :--- | :----------------------- |
| `docs/design/logo-concepts/capture-logos-2x.js` | 992B | Design reference script. |
| `docs/design/logo-concepts/capture-logos.js`    | 1.2K | Design reference script. |

---

## 🔴 Keep (False Positives)

These files were flagged as unused by Knip but should be kept.

| File Path                                      | Reason                                                       |
| :--------------------------------------------- | :----------------------------------------------------------- |
| `.lintstagedrc.js`                             | Configuration file.                                          |
| `commitlint.config.js`                         | Configuration file.                                          |
| `apps/web/src/lib/supabase/middleware.ts`      | Next.js/Supabase Middleware convention.                      |
| `packages/database/src/supabase/middleware.ts` | Shared middleware logic.                                     |
| `tooling/tailwind/preset.js`                   | Tailwind configuration preset.                               |
| `packages/ui/src/index.ts`                     | Entry point (barrel file).                                   |
| `packages/database/src/supabase/index.ts`      | Entry point (barrel file).                                   |
| `packages/types/src/index.ts`                  | Entry point (barrel file).                                   |
| `apps/web/src/lib/supabase/client.ts`          | Referenced via string/indirectly (214 refs).                 |
| `apps/web/src/lib/supabase/index.ts`           | Referenced via string/indirectly (144 refs).                 |
| `tooling/eslint/*.js`                          | Build/Lint tooling.                                          |
| `packages/ui/tokens/*.ts`                      | Used in styling/theme system.                                |
| `apps/web/src/components/dashboard/*.tsx`      | Active UI components (Knip false positive).                  |
| `packages/database/src/schema/*.ts`            | Database schema definitions (referenced by Drizzle/scripts). |
