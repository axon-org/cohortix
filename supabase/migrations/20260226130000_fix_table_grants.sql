-- Fix missing table-level grants for projects, tasks, milestones
-- These tables were created without GRANT statements, causing
-- "permission denied" errors via PostgREST (even with service_role key).

-- Projects
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

-- Tasks
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

-- Milestones
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;
