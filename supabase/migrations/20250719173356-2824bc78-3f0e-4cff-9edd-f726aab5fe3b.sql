-- Fix Function Search Path Mutable: Set stable search_path for security
-- This prevents potential SQL injection and privilege escalation attacks

-- Update the update_updated_at_column function with stable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the update_installations_updated_at function with stable search_path  
CREATE OR REPLACE FUNCTION public.update_installations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the update_public_repositories_updated_at function with stable search_path
CREATE OR REPLACE FUNCTION public.update_public_repositories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public  
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the prevent_repository_deletion function with stable search_path
CREATE OR REPLACE FUNCTION public.prevent_repository_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Block ANY deletion attempts on repository-related tables
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'DELETION BLOCKED: Repository data cannot be deleted. Use soft deletion instead. Table: %, ID: %', TG_TABLE_NAME, OLD.id;
  END IF;
  RETURN NULL;
END;
$$;

-- Update the safe_soft_delete function with stable search_path
CREATE OR REPLACE FUNCTION public.safe_soft_delete(
  table_name TEXT,
  record_id UUID,
  reason TEXT DEFAULT 'User requested'
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;