-- Fix Security Definer Views: Recreate with security_invoker=on
-- This ensures views use the querying user's permissions, not the view creator's

-- Recreate active_repositories view with security invoker
CREATE OR REPLACE VIEW public.active_repositories 
WITH (security_invoker=on) AS
SELECT * FROM public.enabled_repositories 
WHERE protection_status = 'active' AND enabled = true;

-- Recreate active_bounties view with security invoker  
CREATE OR REPLACE VIEW public.active_bounties 
WITH (security_invoker=on) AS
SELECT * FROM public.bounties 
WHERE protection_status = 'active' AND status != 'inactive';