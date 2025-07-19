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

    // Use Coinbase Advanced Trade API for production
    const apiKey = Deno.env.get('COINBASE_API_KEY_ID');
    const apiSecret = Deno.env.get('COINBASE_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      throw new Error('Coinbase API credentials not configured');
    }

    // Create authentication for Coinbase Advanced Trade API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/api/v3/brokerage/accounts';
    const message = timestamp + method + path;
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const accountsResponse = await fetch(`https://api.coinbase.com${path}`, {
      method,
      headers: {
        'CB-ACCESS-KEY': apiKey,
        'CB-ACCESS-SIGN': signatureHex,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
      },
    });

    if (!accountsResponse.ok) {
      throw new Error(`Coinbase API error: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    // Calculate total USD balance
    let totalUsd = 0;
    const accountBalances = [];

    for (const account of accounts) {
      const balance = parseFloat(account.available_balance?.value || '0');
      const currency = account.available_balance?.currency || '';
      
      if (currency === 'USD') {
        totalUsd += balance;
      } else if (['USDC', 'USDT'].includes(currency)) {
        totalUsd += balance; // Assume stablecoins are 1:1 with USD
      }

      accountBalances.push({
        id: account.uuid,
        name: account.name,
        primary: account.default || false,
        type: account.type,
        balance: {
          amount: account.available_balance?.value || '0',
          currency: account.available_balance?.currency || 'USD'
        }
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