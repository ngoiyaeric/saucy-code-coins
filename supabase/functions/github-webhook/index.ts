
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get('GITHUB_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      const sigHex = signature.replace('sha256=', '');
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedHex = Array.from(new Uint8Array(expectedSig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (sigHex !== expectedHex) {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const payload = JSON.parse(body);

    console.log('GitHub webhook received:', payload.action, payload.pull_request?.number || payload.installation?.id);

    // Handle installation events
    if (payload.installation) {
      if (payload.action === 'created' || payload.action === 'repositories_added') {
        await handleInstallation(supabaseClient, payload);
      } else if (payload.action === 'deleted' || payload.action === 'repositories_removed') {
        await handleInstallationRemoval(supabaseClient, payload);
      }
    }

    // Handle pull request events for automatic bounty payouts
    if (payload.pull_request && payload.action === 'closed' && payload.pull_request.merged) {
      console.log('Pull request merged, processing bounty payout...');
      
      const pr = payload.pull_request;
      const repository = payload.repository;
      
      // Extract issue numbers from PR body or title
      const issueNumbers = extractIssueNumbers(pr.body + ' ' + pr.title);
      
      if (issueNumbers.length > 0) {
        // Process payouts for each linked issue
        for (const issueNumber of issueNumbers) {
          try {
            const payoutResponse = await supabaseClient.functions.invoke('process-bounty-payout', {
              body: {
                repositoryId: repository.id.toString(),
                repositoryName: repository.full_name,
                pullRequestNumber: pr.number,
                pullRequestId: pr.id.toString(),
                contributorId: pr.user.id.toString(),
                contributorLogin: pr.user.login,
                issueNumber: issueNumber
              }
            });

            console.log(`Bounty payout processing result for issue #${issueNumber}:`, payoutResponse);
          } catch (error) {
            console.error(`Error processing payout for issue #${issueNumber}:`, error);
          }
        }
      } else {
        console.log('No issue numbers found in PR body/title');
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

async function getBountyAmount(supabaseClient: any, repoFullName: string, issueNumber: number): Promise<{ amount: number; bountyId: string } | null> {
  // Check if there's an active bounty for this specific issue
  const { data: bounty, error } = await supabaseClient
    .from('bounties')
    .select('id, amount, currency')
    .eq('repository_name', repoFullName)
    .eq('issue_number', issueNumber)
    .eq('status', 'active')
    .single();

  if (error || !bounty) {
    console.log(`No active bounty found for issue #${issueNumber} in ${repoFullName}`);
    return null;
  }

  return { amount: bounty.amount, bountyId: bounty.id };
}

async function handleInstallation(supabaseClient: any, payload: any) {
  const installation = payload.installation;
  const account = installation.account;
  
  try {
    await supabaseClient
      .from('github_installations')
      .upsert({
        installation_id: installation.id.toString(),
        account_id: account.id.toString(),
        account_login: account.login,
        account_type: account.type,
        permissions: installation.permissions || {},
        repository_selection: installation.repository_selection || 'selected'
      });
    
    console.log(`GitHub app installed for ${account.login} (${account.type})`);
  } catch (error) {
    console.error('Error recording installation:', error);
  }
}

async function handleInstallationRemoval(supabaseClient: any, payload: any) {
  const installation = payload.installation;
  
  try {
    await supabaseClient
      .from('github_installations')
      .delete()
      .eq('installation_id', installation.id.toString());
    
    console.log(`GitHub app uninstalled for installation ${installation.id}`);
  } catch (error) {
    console.error('Error removing installation:', error);
  }
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
