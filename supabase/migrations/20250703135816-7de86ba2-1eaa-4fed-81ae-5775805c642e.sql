-- Update pricing plans to reflect 2.5% transaction fee model with free trial
UPDATE plans SET 
  name = 'Free Trial',
  description = '7-day free trial, then 2.5% fee per payout',
  price_monthly = 0,
  price_yearly = 0,
  features = '["7-day free trial", "2.5% fee per payout after trial", "All repositories", "GitHub integration", "Basic support"]'::jsonb,
  is_popular = true
WHERE name = 'Free';

-- Remove other plans as we're moving to a transaction-based model
DELETE FROM plans WHERE name IN ('Pro', 'Business');