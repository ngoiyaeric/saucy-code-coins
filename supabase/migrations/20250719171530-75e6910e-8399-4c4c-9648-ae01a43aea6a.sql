-- Create tables for public repository and issue tracking
CREATE TABLE IF NOT EXISTS public.public_repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  stargazers_count INTEGER DEFAULT 0,
  open_issues_count INTEGER DEFAULT 0,
  language TEXT,
  owner_login TEXT NOT NULL,
  owner_type TEXT NOT NULL,
  last_scanned TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.public_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id TEXT NOT NULL UNIQUE,
  repository_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL DEFAULT 'open',
  labels JSONB DEFAULT '[]'::jsonb,
  comments_count INTEGER DEFAULT 0,
  html_url TEXT NOT NULL,
  complexity TEXT NOT NULL DEFAULT 'medium',
  suggested_bounty NUMERIC DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_public_repositories_stars ON public.public_repositories(stargazers_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_repositories_issues ON public.public_repositories(open_issues_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_repositories_scanned ON public.public_repositories(last_scanned DESC);
CREATE INDEX IF NOT EXISTS idx_public_issues_repository ON public.public_issues(repository_id);
CREATE INDEX IF NOT EXISTS idx_public_issues_complexity ON public.public_issues(complexity);
CREATE INDEX IF NOT EXISTS idx_public_issues_bounty ON public.public_issues(suggested_bounty DESC);
CREATE INDEX IF NOT EXISTS idx_public_issues_state ON public.public_issues(state);

-- Enable Row Level Security
ALTER TABLE public.public_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_issues ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read-only for public data)
CREATE POLICY "Public repositories are viewable by everyone" 
ON public.public_repositories 
FOR SELECT 
USING (true);

CREATE POLICY "Public issues are viewable by everyone" 
ON public.public_issues 
FOR SELECT 
USING (true);

-- Allow service role to manage this data
CREATE POLICY "Service role can manage public repositories" 
ON public.public_repositories 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage public issues" 
ON public.public_issues 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_public_repositories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_public_repositories_updated_at
  BEFORE UPDATE ON public.public_repositories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_public_repositories_updated_at();

-- Add enhanced logging for bounty processing
CREATE TABLE IF NOT EXISTS public.bounty_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES public.bounties(id),
  payout_id UUID REFERENCES public.payouts(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bounty logs
ALTER TABLE public.bounty_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for bounty logs
CREATE POLICY "Users can view logs for their bounties and payouts" 
ON public.bounty_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bounties b 
    WHERE b.id = bounty_logs.bounty_id 
    AND b.creator_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.payouts p 
    WHERE p.id = bounty_logs.payout_id 
    AND p.contributor_id = auth.uid()
  )
);

-- Add indexes for bounty logs
CREATE INDEX IF NOT EXISTS idx_bounty_logs_bounty_id ON public.bounty_logs(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_logs_payout_id ON public.bounty_logs(payout_id);
CREATE INDEX IF NOT EXISTS idx_bounty_logs_created_at ON public.bounty_logs(created_at DESC);