import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoinbaseAccount {
  id: string;
  name: string;
  primary: boolean;
  type: string;
  balance: {
    amount: string;
    currency: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid authorization');
    }

    // Get user's Coinbase auth
    const { data: coinbaseAuth, error: authError } = await supabaseClient
      .from('coinbase_auth')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (authError || !coinbaseAuth) {
      return new Response(JSON.stringify({ error: 'Coinbase not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Development mode - return mock balance
    if (coinbaseAuth.access_token === 'dev-mock-access-token') {
      return new Response(JSON.stringify({
        accounts: [
          {
            id: 'mock-account',
            name: 'USD Wallet',
            primary: true,
            type: 'wallet',
            balance: {
              amount: '1000.00',
              currency: 'USD'
            }
          }
        ],
        totalUsd: 1000.00
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Real Coinbase API call
    const accountsResponse = await fetch('https://api.coinbase.com/v2/accounts', {
      headers: {
        'Authorization': `Bearer ${coinbaseAuth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountsResponse.ok) {
      throw new Error(`Coinbase API error: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts: CoinbaseAccount[] = accountsData.data || [];

    // Calculate total USD balance
    let totalUsd = 0;
    const accountBalances = [];

    for (const account of accounts) {
      const balance = parseFloat(account.balance.amount);
      
      if (account.balance.currency === 'USD') {
        totalUsd += balance;
      } else {
        // For other currencies, we'd need to convert to USD
        // For now, we'll assume a simple conversion or skip non-USD
        // In production, you'd want to use exchange rates
        if (['USDC', 'USDT'].includes(account.balance.currency)) {
          totalUsd += balance; // Assume stablecoins are 1:1 with USD
        }
      }

      accountBalances.push({
        id: account.id,
        name: account.name,
        primary: account.primary,
        type: account.type,
        balance: account.balance
      });
    }

    return new Response(JSON.stringify({
      accounts: accountBalances,
      totalUsd: totalUsd
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Balance check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});