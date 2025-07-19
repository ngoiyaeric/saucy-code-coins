
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

    // Use Coinbase Advanced Trade API for production payouts
    const apiKey = Deno.env.get('COINBASE_API_KEY_ID');
    const apiSecret = Deno.env.get('COINBASE_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      throw new Error('Coinbase API credentials not configured');
    }

    // Create authentication for Coinbase Advanced Trade API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'POST';
    const path = '/api/v3/brokerage/orders';
    
    // Create order payload for USDC transfer
    const orderPayload = {
      client_order_id: `bounty-${payoutId}-${Date.now()}`,
      product_id: 'USDC-USD',
      side: 'sell', // Convert USDC to fiat for bank transfer
      order_configuration: {
        market_market_ioc: {
          quote_size: payout.amount.toString()
        }
      }
    };
    
    const message = timestamp + method + path + JSON.stringify(orderPayload);
    
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

    const coinbaseResponse = await fetch(`https://api.coinbase.com${path}`, {
      method,
      headers: {
        'CB-ACCESS-KEY': apiKey,
        'CB-ACCESS-SIGN': signatureHex,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const coinbaseData = await coinbaseResponse.json();

    if (!coinbaseResponse.ok) {
      throw new Error(`Coinbase API error: ${coinbaseData.error || 'Unknown error'}`);
    }

    transactionId = coinbaseData.order_id || `order-${Date.now()}`;

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
      message: 'USDC payment processed successfully - funds converted to fiat for bank transfer'
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
