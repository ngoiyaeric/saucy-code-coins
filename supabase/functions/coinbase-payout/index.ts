import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayoutRequest {
  bountyId: string;
  contributorId: string;
  contributorEmail: string;
  amount: number;
  currency: string;
  pullRequestId: string;
  pullRequestNumber: number;
  repositoryId: string;
  repositoryName: string;
  contributorName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bountyId,
      contributorId,
      contributorEmail,
      amount,
      currency,
      pullRequestId,
      pullRequestNumber,
      repositoryId,
      repositoryName,
      contributorName
    }: PayoutRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if payout already exists
    const { data: existingPayout, error: payoutCheckError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', bountyId)
      .single();

    if (payoutCheckError || !existingPayout) {
      throw new Error('Payout not found');
    }

    if (existingPayout.status === 'completed') {
      throw new Error('Payout already completed');
    }

    // Get Coinbase access token for the contributor (payout recipient)
    const { data: coinbaseAuth, error: authError } = await supabase
      .from('coinbase_auth')
      .select('access_token')
      .eq('user_id', contributorId)
      .single();

    if (authError || !coinbaseAuth) {
      throw new Error('Coinbase authentication not found for contributor');
    }

    // Update payout status to processing
    const { error: updateError } = await supabase
      .from('payouts')
      .update({ status: 'processing' })
      .eq('id', bountyId);

    if (updateError) {
      throw new Error('Failed to update payout status');
    }

    // Initiate Coinbase transfer
    const coinbasePayload = {
      type: 'send',
      to: contributorEmail,
      amount: amount.toString(),
      currency: currency,
      description: `Bounty payout for PR #${pullRequestNumber} in ${repositoryName}`
    };

    const coinbaseResponse = await fetch('https://api.coinbase.com/v2/accounts/primary/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${coinbaseAuth.access_token}`,
        'Content-Type': 'application/json',
        'CB-VERSION': '2023-05-15'
      },
      body: JSON.stringify(coinbasePayload)
    });

    const coinbaseResult = await coinbaseResponse.json();

    if (!coinbaseResponse.ok) {
      console.error('Coinbase API error:', coinbaseResult);
      
      // Update payout status to failed
      await supabase
        .from('payouts')
        .update({ status: 'failed' })
        .eq('id', bountyId);

      throw new Error(`Coinbase API error: ${coinbaseResult.errors?.[0]?.message || 'Unknown error'}`);
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        payout_id: bountyId,
        amount,
        currency,
        coinbase_transaction_id: coinbaseResult.data.id,
        status: 'completed'
      });

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError);
    }

    // Update payout status to completed
    await supabase
      .from('payouts')
      .update({ status: 'completed' })
      .eq('id', bountyId);

    // Find and update the related bounty status to paid
    const { data: relatedBounty } = await supabase
      .from('bounties')
      .select('id')
      .eq('repository_name', repositoryName)
      .eq('issue_number', existingPayout.pull_request_number)
      .single();

    if (relatedBounty) {
      await supabase
        .from('bounties')
        .update({ status: 'paid' })
        .eq('id', relatedBounty.id);
    }

    console.log(`Payout completed: ${amount} ${currency} to ${contributorEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        payoutId: bountyId,
        transactionId: coinbaseResult.data.id,
        message: 'Payout completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in coinbase-payout function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Payout failed',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});