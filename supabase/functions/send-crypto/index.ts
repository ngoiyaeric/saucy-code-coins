
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

    // Send crypto via Coinbase API
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

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        payout_id: payoutId,
        coinbase_transaction_id: coinbaseData.data.id,
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
      transactionId: coinbaseData.data.id,
      message: 'Crypto payment sent successfully',
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
