
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

    const signature = req.headers.get('x-hub-signature-256');
    const body = await req.text();
    const payload = JSON.parse(body);

    console.log('GitHub webhook received:', payload.action, payload.pull_request?.number);

    // Handle pull request events
    if (payload.pull_request && payload.action === 'closed' && payload.pull_request.merged) {
      const pr = payload.pull_request;
      const repository = payload.repository;
      
      // Extract issue numbers from PR body or title
      const issueNumbers = extractIssueNumbers(pr.body + ' ' + pr.title);
      
      if (issueNumbers.length > 0) {
        // Create payout entries for each linked issue
        for (const issueNumber of issueNumbers) {
          // Check if this issue has a bounty
          const bountyAmount = await getBountyAmount(repository.full_name, issueNumber);
          
          if (bountyAmount > 0) {
            const { error } = await supabaseClient
              .from('payouts')
              .insert({
                repository_id: repository.id.toString(),
                repository_name: repository.full_name,
                pull_request_id: pr.id.toString(),
                pull_request_number: pr.number,
                contributor_id: pr.user.id.toString(),
                contributor_name: pr.user.login,
                amount: bountyAmount,
                currency: 'USD',
                status: 'pending'
              });

            if (error) {
              console.error('Error creating payout:', error);
            } else {
              console.log(`Payout created for PR #${pr.number}, issue #${issueNumber}`);
              
              // Post comment on PR with claim link
              await postClaimComment(repository.full_name, pr.number, bountyAmount);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractIssueNumbers(text: string): number[] {
  const regex = /#(\d+)|fixes?\s+#(\d+)|closes?\s+#(\d+)|resolves?\s+#(\d+)/gi;
  const matches = text.match(regex);
  if (!matches) return [];
  
  return matches.map(match => {
    const numberMatch = match.match(/\d+/);
    return numberMatch ? parseInt(numberMatch[0]) : 0;
  }).filter(num => num > 0);
}

async function getBountyAmount(repoFullName: string, issueNumber: number): Promise<number> {
  // This would typically check GitHub issue labels or a database
  // For now, return a mock amount
  return 50; // $50 bounty
}

async function postClaimComment(repoFullName: string, prNumber: number, amount: number) {
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  if (!githubToken) return;

  const comment = `🎉 Congratulations! Your pull request has been merged and you've earned a $${amount} bounty!

[Claim your reward here](${Deno.env.get('SUPABASE_URL')}/dashboard?claim=true)

This payment will be processed through Coinbase and sent to your connected wallet.`;

  try {
    await fetch(`https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: comment }),
    });
  } catch (error) {
    console.error('Error posting comment:', error);
  }
}
