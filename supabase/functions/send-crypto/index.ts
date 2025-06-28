
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { payoutId, userId, walletAddress } = await req.json();

    console.log('Processing crypto payment request:', { payoutId, userId, walletAddress });

    // Get the payout details
    const { data: payout, error: payoutError } = await supabaseClient
      .from('payouts')
      .select('*')
      .eq('id', payoutId)
      .eq('contributor_id', userId)
      .single();

    if (payoutError || !payout) {
      throw new Error('Payout not found or unauthorized');
    }

    if (payout.status !== 'pending') {
      throw new Error('Payout has already been processed');
    }

    // Get user's Coinbase auth
    const { data: coinbaseAuth } = await supabaseClient
      .from('coinbase_auth')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (!coinbaseAuth) {
      throw new Error('Coinbase authentication not found');
    }

    let transactionId = 'mock-transaction-id';
    let success = true;

    // Check if we're in development mode
    if (coinbaseAuth.access_token === 'dev-mock-access-token') {
      console.log('Using development mode for crypto payment');
      
      // Simulate successful payment in development mode
      transactionId = `dev-tx-${Date.now()}`;
      console.log(`Mock payment of ${payout.amount} USDC to ${walletAddress}`);
      
    } else {
      // Real Coinbase API call (when actual credentials are provided)
      const coinbaseResponse = await fetch('https://api.coinbase.com/v2/accounts/primary/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${coinbaseAuth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'send',
          to: walletAddress,
          amount: payout.amount.toString(),
          currency: 'USDC', // Send USDC stablecoin
          description: `Bounty payment for PR #${payout.pull_request_number} in ${payout.repository_name}`,
        }),
      });

      const coinbaseData = await coinbaseResponse.json();

      if (!coinbaseResponse.ok) {
        throw new Error(`Coinbase API error: ${coinbaseData.errors?.[0]?.message || 'Unknown error'}`);
      }

      transactionId = coinbaseData.data.id;
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        payout_id: payoutId,
        coinbase_transaction_id: transactionId,
        amount: payout.amount,
        currency: 'USDC',
        status: 'pending',
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
    }

    // Update payout status
    const { error: updateError } = await supabaseClient
      .from('payouts')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

    if (updateError) {
      console.error('Error updating payout status:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      transactionId: transactionId,
      message: coinbaseAuth.access_token === 'dev-mock-access-token' 
        ? 'Mock crypto payment processed successfully (development mode)'
        : 'Crypto payment sent successfully',
      developmentMode: coinbaseAuth.access_token === 'dev-mock-access-token'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending crypto:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
