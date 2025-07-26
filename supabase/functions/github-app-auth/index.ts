import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GitHub App authentication using installation tokens
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { installationId, endpoint } = await req.json();

    // Get GitHub App credentials
    const githubAppId = Deno.env.get('GITHUB_APP_ID');
    const githubPrivateKey = Deno.env.get('GITHUB_PRIVATE_KEY');

    if (!githubAppId || !githubPrivateKey) {
      throw new Error('GitHub App credentials not configured');
    }

    // Create JWT for GitHub App authentication
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: githubAppId,
      exp: now + 60, // 1 minute expiration
      iat: now - 60, // Issued 1 minute ago to account for clock skew
    };

    // For demonstration - in production you'd use a proper JWT library
    // This is a simplified JWT creation for GitHub App auth
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'RS256' }));
    const payloadStr = btoa(JSON.stringify(payload));
    const jwt = `${header}.${payloadStr}.<signature>`;

    // Get installation access token
    const installationTokenResponse = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Saucy-GitHub-App/1.0',
        },
      }
    );

    if (!installationTokenResponse.ok) {
      throw new Error('Failed to get installation access token');
    }

    const tokenData = await installationTokenResponse.json();

    // Make the actual GitHub API request
    const apiResponse = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Saucy-GitHub-App/1.0',
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`GitHub API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error with GitHub App auth:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});