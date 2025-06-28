
-- Create table to store GitHub authentication info
CREATE TABLE public.github_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.github_auth ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own GitHub auth
CREATE POLICY "Users can view their own GitHub auth" 
  ON public.github_auth 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own GitHub auth
CREATE POLICY "Users can insert their own GitHub auth" 
  ON public.github_auth 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own GitHub auth
CREATE POLICY "Users can update their own GitHub auth" 
  ON public.github_auth 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create table to store Coinbase authentication info
CREATE TABLE public.coinbase_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coinbase_auth ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own Coinbase auth
CREATE POLICY "Users can view their own Coinbase auth" 
  ON public.coinbase_auth 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own Coinbase auth
CREATE POLICY "Users can insert their own Coinbase auth" 
  ON public.coinbase_auth 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own Coinbase auth
CREATE POLICY "Users can update their own Coinbase auth" 
  ON public.coinbase_auth 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create payouts table first (since it's referenced by transactions)
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id TEXT NOT NULL,
  repository_name TEXT NOT NULL,
  pull_request_id TEXT NOT NULL,
  pull_request_number INTEGER NOT NULL,
  contributor_id UUID REFERENCES auth.users NOT NULL,
  contributor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'claimed', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own payouts
CREATE POLICY "Users can view their own payouts" 
  ON public.payouts 
  FOR SELECT 
  USING (contributor_id = auth.uid());

-- Create transaction history table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID REFERENCES public.payouts NOT NULL,
  coinbase_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own transactions
CREATE POLICY "Users can view their own transactions" 
  ON public.transactions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.payouts p
    WHERE p.id = payout_id
    AND p.contributor_id = auth.uid()
  ));
