import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  action: string;
  pull_request: {
    id: number;
    number: number;
    title: string;
    merged: boolean;
    user: {
      id: number;
      login: string;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();

    // Only process closed PRs that were merged
    if (payload.action !== 'closed' || !payload.pull_request.merged) {
      return new Response(
        JSON.stringify({ message: 'Not a merged PR, ignoring' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing merged PR #${payload.pull_request.number} in ${payload.repository.full_name}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look for active bounties on issues linked to this PR
    // In GitHub, PRs that fix issues often reference them in the body or title
    const { data: bounties, error: bountiesError } = await supabase
      .from('bounties')
      .select('*')
      .eq('repository_id', payload.repository.id.toString())
      .eq('status', 'active');

    if (bountiesError) {
      console.error('Error fetching bounties:', bountiesError);
      throw new Error('Failed to fetch bounties');
    }

    if (!bounties || bounties.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active bounties found for this repository' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${bounties.length} active bounties for repository`);

    // Extract issue numbers from PR body and title
    const issueNumbers = extractIssueNumbers(payload.pull_request.title + ' ' + payload.pull_request.body);
    
    // Find bounties for the specific issues linked to this PR
    const linkedBounties = bounties.filter(bounty => 
      issueNumbers.includes(bounty.issue_number)
    );

    if (linkedBounties.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bounties found for issues linked to this PR' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the first linked bounty (could be extended to handle multiple)
    const bounty = linkedBounties[0];

    // Get contributor's GitHub user ID (this would be used to match with our user system)
    const contributorGithubId = payload.pull_request.user.id.toString();
    const contributorName = payload.pull_request.user.login;

    // For now, we'll create a payout record without actual Coinbase integration
    // since we need the contributor's email and Coinbase account info
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        contributor_id: contributorGithubId, // This should be mapped to our user system
        contributor_name: contributorName,
        amount: bounty.amount,
        currency: bounty.currency,
        pull_request_id: payload.pull_request.id.toString(),
        pull_request_number: payload.pull_request.number,
        repository_id: bounty.repository_id,
        repository_name: bounty.repository_name,
        status: 'pending_claim' // Status indicating contributor needs to claim the payout
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      throw new Error('Failed to create payout record');
    }

    // Update bounty status
    await supabase
      .from('bounties')
      .update({ status: 'pending_payout' })
      .eq('id', bounty.id);

    console.log(`Created payout record for ${contributorName}: ${bounty.amount} ${bounty.currency}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payout triggered successfully',
        payoutId: payout.id,
        contributorName,
        amount: bounty.amount,
        currency: bounty.currency
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in trigger-payout function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process webhook',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractIssueNumbers(text: string): number[] {
  if (!text) return [];
  
  const regex = /#(\d+)|fixes?\s+#(\d+)|closes?\s+#(\d+)|resolves?\s+#(\d+)/gi;
  const matches = text.match(regex);
  if (!matches) return [];
  
  return matches.map(match => {
    const numberMatch = match.match(/\d+/);
    return numberMatch ? parseInt(numberMatch[0]) : 0;
  }).filter(num => num > 0);
}