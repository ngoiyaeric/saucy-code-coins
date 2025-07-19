-- CRITICAL REPOSITORY PROTECTION: Add database-level safeguards

-- Create a trigger function that prevents deletion of repository data
CREATE OR REPLACE FUNCTION public.prevent_repository_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Block ANY deletion attempts on repository-related tables
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'DELETION BLOCKED: Repository data cannot be deleted. Use soft deletion instead. Table: %, ID: %', TG_TABLE_NAME, OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply deletion protection to critical tables
DROP TRIGGER IF EXISTS protect_enabled_repositories_deletion ON public.enabled_repositories;
CREATE TRIGGER protect_enabled_repositories_deletion
  BEFORE DELETE ON public.enabled_repositories
  FOR EACH ROW EXECUTE FUNCTION public.prevent_repository_deletion();

DROP TRIGGER IF EXISTS protect_bounties_deletion ON public.bounties;
CREATE TRIGGER protect_bounties_deletion
  BEFORE DELETE ON public.bounties
  FOR EACH ROW EXECUTE FUNCTION public.prevent_repository_deletion();

DROP TRIGGER IF EXISTS protect_public_repositories_deletion ON public.public_repositories;
CREATE TRIGGER protect_public_repositories_deletion
  BEFORE DELETE ON public.public_repositories
  FOR EACH ROW EXECUTE FUNCTION public.prevent_repository_deletion();

DROP TRIGGER IF EXISTS protect_public_issues_deletion ON public.public_issues;
CREATE TRIGGER protect_public_issues_deletion
  BEFORE DELETE ON public.public_issues
  FOR EACH ROW EXECUTE FUNCTION public.prevent_repository_deletion();

-- Add a protection status column to track soft deletions
ALTER TABLE public.enabled_repositories 
ADD COLUMN IF NOT EXISTS protection_status TEXT DEFAULT 'active';

ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS protection_status TEXT DEFAULT 'active';

ALTER TABLE public.public_repositories 
ADD COLUMN IF NOT EXISTS protection_status TEXT DEFAULT 'active';

-- Create indexes for protection status
CREATE INDEX IF NOT EXISTS idx_enabled_repositories_protection ON public.enabled_repositories(protection_status);
CREATE INDEX IF NOT EXISTS idx_bounties_protection ON public.bounties(protection_status);
CREATE INDEX IF NOT EXISTS idx_public_repositories_protection ON public.public_repositories(protection_status);

-- Create a function for safe soft deletion
CREATE OR REPLACE FUNCTION public.safe_soft_delete(
  table_name TEXT,
  record_id UUID,
  reason TEXT DEFAULT 'User requested'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  query_text TEXT;
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name NOT IN ('enabled_repositories', 'bounties', 'public_repositories') THEN
    RAISE EXCEPTION 'Table % not allowed for soft deletion', table_name;
  END IF;

  -- Construct safe update query
  query_text := format(
    'UPDATE public.%I SET protection_status = ''inactive'', updated_at = now() WHERE id = $1 RETURNING *',
    table_name
  );
  
  -- Execute the soft delete
  EXECUTE query_text USING record_id INTO result;
  
  -- Log the operation
  INSERT INTO public.bounty_logs (action, details, success)
  VALUES (
    'soft_deletion',
    jsonb_build_object(
      'table', table_name,
      'record_id', record_id,
      'reason', reason,
      'timestamp', now()
    ),
    true
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'operation', 'soft_delete',
    'table', table_name,
    'record_id', record_id,
    'status', 'inactive'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view that excludes soft-deleted records
CREATE OR REPLACE VIEW public.active_repositories AS
SELECT * FROM public.enabled_repositories 
WHERE protection_status = 'active' AND enabled = true;

CREATE OR REPLACE VIEW public.active_bounties AS
SELECT * FROM public.bounties 
WHERE protection_status = 'active' AND status != 'inactive';

-- Grant usage permissions
GRANT EXECUTE ON FUNCTION public.safe_soft_delete(TEXT, UUID, TEXT) TO authenticated;
GRANT SELECT ON public.active_repositories TO authenticated;
GRANT SELECT ON public.active_bounties TO authenticated;