import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayoutWebhookPayload {
  action: string;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: PayoutWebhookPayload = await req.json();

    // Only process closed PRs that were merged
    if (payload.action !== 'closed' || !payload.pull_request.merged) {
      return new Response(
        JSON.stringify({ message: 'Not a merged PR, ignoring' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing merged PR #${payload.pull_request.number} in ${payload.repository.full_name}`);

    // Extract issue numbers from PR body and title
    const issueNumbers = extractIssueNumbers(payload.pull_request.title + ' ' + payload.pull_request.body);
    
    if (issueNumbers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No linked issues found in PR' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look for active bounties on the linked issues
    const { data: bounties, error: bountiesError } = await supabase
      .from('bounties')
      .select('*')
      .eq('repository_name', payload.repository.full_name)
      .in('issue_number', issueNumbers)
      .eq('status', 'active');

    if (bountiesError) {
      console.error('Error fetching bounties:', bountiesError);
      throw new Error('Failed to fetch bounties');
    }

    if (!bounties || bounties.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active bounties found for linked issues' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${bounties.length} active bounties for linked issues`);

    const results = [];

    // Process each bounty
    for (const bounty of bounties) {
      const contributorGithubId = payload.pull_request.user.id.toString();
      const contributorName = payload.pull_request.user.login;

      // Create payout record
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .insert({
          contributor_id: contributorGithubId,
          contributor_name: contributorName,
          amount: bounty.amount,
          currency: bounty.currency,
          pull_request_id: payload.pull_request.id.toString(),
          pull_request_number: payload.pull_request.number,
          repository_id: payload.repository.id.toString(),
          repository_name: payload.repository.full_name,
          status: 'pending_claim'
        })
        .select()
        .single();

      if (payoutError) {
        console.error('Error creating payout:', payoutError);
        continue;
      }

      // Update bounty status
      await supabase
        .from('bounties')
        .update({ status: 'pending_payout' })
        .eq('id', bounty.id);

      // Post comment on GitHub PR
      await postClaimComment(payload.repository.full_name, payload.pull_request.number, bounty.amount, payout.id);

      results.push({
        bountyId: bounty.id,
        payoutId: payout.id,
        amount: bounty.amount,
        currency: bounty.currency,
        issueNumber: bounty.issue_number
      });

      console.log(`Created payout for ${contributorName}: ${bounty.amount} ${bounty.currency} (Issue #${bounty.issue_number})`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payouts created successfully',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in payout-webhook function:', error);
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

async function postClaimComment(repoFullName: string, prNumber: number, amount: number, payoutId: string) {
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  if (!githubToken) {
    console.log('No GitHub token available for posting comments');
    return;
  }

  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';
  const comment = `🎉 Congratulations! Your pull request has been merged and you've earned a $${amount} bounty!

[Claim your reward here](${siteUrl}/dashboard?claim=${payoutId})

This payment will be processed through Coinbase and sent to your connected wallet.`;

  try {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: comment }),
    });

    if (!response.ok) {
      console.error('Failed to post GitHub comment:', await response.text());
    } else {
      console.log('Successfully posted claim comment on GitHub');
    }
  } catch (error) {
    console.error('Error posting GitHub comment:', error);
  }
}