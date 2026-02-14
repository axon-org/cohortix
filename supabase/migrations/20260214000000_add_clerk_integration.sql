-- Migration: Add Clerk Integration Columns
-- Date: 2026-02-14
-- Description: Add Clerk user and organization IDs for Clerk + Supabase integration
--
-- This migration adds:
-- 1. clerk_user_id to profiles table (foreign key replacement for auth.users)
-- 2. clerk_org_id to organizations table
-- 3. Indexes for efficient lookups
-- 4. Updated RLS policies to work with Clerk

-- ============================================================================
-- Add Clerk Columns
-- ============================================================================

-- Add clerk_user_id to profiles table
-- This replaces the Supabase auth.users(id) as the primary identifier
ALTER TABLE profiles
ADD COLUMN clerk_user_id VARCHAR(255) UNIQUE,
ADD COLUMN first_name VARCHAR(255),
ADD COLUMN last_name VARCHAR(255),
ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add clerk_org_id to organizations table
ALTER TABLE organizations
ADD COLUMN clerk_org_id VARCHAR(255) UNIQUE;

-- ============================================================================
-- Create Indexes
-- ============================================================================

CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);

-- ============================================================================
-- Update RLS Policies
-- ============================================================================

-- Drop existing RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their organizations" ON organization_memberships;

-- Note: RLS will be temporarily disabled for Clerk migration
-- The application will use service role client with explicit user_id checks
-- This is because Clerk user ID is not in auth.users, so auth.uid() won't work
-- Future: Consider using Clerk JWT custom claims if Supabase supports it

-- For now, we rely on application-level auth via getAuthContext()
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration Notes
-- ============================================================================

-- After this migration:
-- 1. Clerk handles authentication (JWT tokens)
-- 2. Webhook syncs Clerk users/orgs to Supabase tables
-- 3. API routes use Clerk's auth() + Supabase service role client
-- 4. clerk_user_id is the source of truth for user identity
-- 5. profiles.id is kept for foreign key relationships (UUID)
-- 6. New users will have clerk_user_id populated by webhook
-- 7. Existing users will need data migration (backfill clerk_user_id)

COMMENT ON COLUMN profiles.clerk_user_id IS 'Clerk user ID - source of truth for authentication';
COMMENT ON COLUMN organizations.clerk_org_id IS 'Clerk organization ID for multi-tenant support';
