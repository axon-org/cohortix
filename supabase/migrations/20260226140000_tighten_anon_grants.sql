-- Tighten table permissions: remove anon grants, add FORCE RLS
-- anon role should not have direct table access (all access goes through
-- authenticated service_role via the app's server-side Supabase client).
-- FORCE RLS ensures policies apply even to table owners.

-- Projects
REVOKE ALL ON public.projects FROM anon;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

-- Tasks
REVOKE ALL ON public.tasks FROM anon;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

-- Milestones
REVOKE ALL ON public.milestones FROM anon;
ALTER TABLE public.milestones FORCE ROW LEVEL SECURITY;
