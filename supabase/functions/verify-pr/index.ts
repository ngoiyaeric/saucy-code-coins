
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

    const { repoOwner, repoName, prNumber, userId } = await req.json();

    // Get user's GitHub token
    const { data: githubAuth } = await supabaseClient
      .from('github_auth')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (!githubAuth) {
      throw new Error('GitHub authentication not found');
    }

    // Verify the PR exists and get details
    const prResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${prNumber}`, {
      headers: {
        'Authorization': `token ${githubAuth.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!prResponse.ok) {
      throw new Error('Pull request not found');
    }

    const prData = await prResponse.json();

    // Verify the PR is merged and authored by the user
    if (!prData.merged) {
      throw new Error('Pull request is not merged');
    }

    // Get user's GitHub username
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${githubAuth.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();

    if (prData.user.login !== userData.login) {
      throw new Error('You are not the author of this pull request');
    }

    // Extract linked issues
    const issueNumbers = extractIssueNumbers(prData.body + ' ' + prData.title);
    
    return new Response(JSON.stringify({
      success: true,
      pr: {
        number: prData.number,
        title: prData.title,
        merged: prData.merged,
        author: prData.user.login,
        linkedIssues: issueNumbers,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error verifying PR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
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
