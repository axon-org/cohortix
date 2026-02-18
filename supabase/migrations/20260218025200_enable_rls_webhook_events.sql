-- Migration: Enable Row Level Security on webhook_events
-- Date: 2026-02-18
-- Purpose: Unblock DB policy guard; webhook_events was created without RLS.
-- Safe to re-run: the ALTER is idempotent (enabling already-enabled RLS is a no-op in Postgres).

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
