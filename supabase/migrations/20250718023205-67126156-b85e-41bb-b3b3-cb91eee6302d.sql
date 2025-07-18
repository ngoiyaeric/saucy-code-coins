-- Add webhook_secret to store GitHub webhook secret for verification
ALTER TABLE public.github_auth ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Add GitHub app installation data
CREATE TABLE IF NOT EXISTS public.github_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL,
  account_login TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'User',
  permissions JSONB DEFAULT '{}',
  repository_selection TEXT DEFAULT 'selected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on github_installations
ALTER TABLE public.github_installations ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing installations (public for webhook processing)
CREATE POLICY "Allow webhook access to installations" 
ON public.github_installations 
FOR SELECT 
USING (true);

-- Create policy for inserting installations
CREATE POLICY "Allow webhook to insert installations" 
ON public.github_installations 
FOR INSERT 
WITH CHECK (true);

-- Create policy for updating installations  
CREATE POLICY "Allow webhook to update installations" 
ON public.github_installations 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_installations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_github_installations_updated_at
  BEFORE UPDATE ON public.github_installations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_installations_updated_at();