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

    const { payoutId, bankDetails } = await req.json();

    console.log('Processing bank transfer request:', { payoutId, bankDetails });

    // Get the payout details
    const { data: payout, error: payoutError } = await supabaseClient
      .from('payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (payoutError || !payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'pending') {
      throw new Error('Payout has already been processed');
    }

    // Get the bounty details to find who should pay (the bounty creator)
    const { data: bounty, error: bountyError } = await supabaseClient
      .from('bounties')
      .select('creator_id, repository_name, issue_number')
      .eq('repository_id', payout.repository_id)
      .eq('issue_number', payout.pull_request_number)
      .single();

    if (bountyError || !bounty) {
      throw new Error('Associated bounty not found');
    }

    // Get the bounty creator's Coinbase auth (repository owner who pays)
    const { data: coinbaseAuth } = await supabaseClient
      .from('coinbase_auth')
      .select('access_token')
      .eq('user_id', bounty.creator_id)
      .single();

    if (!coinbaseAuth) {
      throw new Error('Repository owner has not connected Coinbase account');
    }

    // Use Coinbase API to convert USDC to fiat and transfer to bank
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'POST';
    const path = '/v2/withdrawals';
    
    // Create bank withdrawal payload
    const withdrawalPayload = {
      type: 'bank_wire',
      amount: payout.amount.toString(),
      currency: 'USD',
      payment_method: {
        type: 'bank_wire',
        bank_details: bankDetails
      },
      description: `Bounty payout for PR #${payout.pull_request_number} in ${payout.repository_name}`
    };
    
    const message = timestamp + method + path + JSON.stringify(withdrawalPayload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(coinbaseAuth.access_token),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const coinbaseResponse = await fetch(`https://api.coinbase.com${path}`, {
      method,
      headers: {
        'CB-ACCESS-KEY': 'use_server_key',
        'CB-ACCESS-SIGN': signatureHex,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'CB-ACCESS-TOKEN': coinbaseAuth.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalPayload),
    });

    const coinbaseData = await coinbaseResponse.json();

    if (!coinbaseResponse.ok) {
      throw new Error(`Coinbase withdrawal failed: ${coinbaseData.error?.message || 'Unknown error'}`);
    }

    const transactionId = coinbaseData.data?.id || `withdrawal-${Date.now()}`;

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        payout_id: payoutId,
        coinbase_transaction_id: transactionId,
        amount: payout.amount,
        currency: 'USD',
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
      message: 'Bank transfer initiated successfully - funds will arrive in 1-3 business days'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing bank transfer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});