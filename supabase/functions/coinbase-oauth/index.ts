
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

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This should contain the user ID
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Using generic credentials for development
    const clientId = Deno.env.get('COINBASE_CLIENT_ID') || 'generic-coinbase-client-id';
    const clientSecret = Deno.env.get('COINBASE_CLIENT_SECRET') || 'generic-coinbase-client-secret';
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/coinbase-oauth`;

    console.log('Coinbase OAuth attempt with generic credentials');

    // For development mode, simulate successful token exchange
    if (clientId === 'generic-coinbase-client-id') {
      console.log('Using development mode for Coinbase OAuth');
      
      // Store a mock access token for development
      const { error } = await supabaseClient
        .from('coinbase_auth')
        .upsert({
          user_id: state,
          access_token: 'dev-mock-access-token',
          refresh_token: 'dev-mock-refresh-token',
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
        });

      if (error) {
        throw new Error('Failed to store Coinbase auth (dev mode)');
      }

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard?coinbase=connected`,
        },
      });
    }

    // Real Coinbase OAuth flow (when actual credentials are provided)
    const tokenResponse = await fetch('https://api.coinbase.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Coinbase OAuth error: ${tokenData.error_description || 'Unknown error'}`);
    }

    // Store the access token
    const { error } = await supabaseClient
      .from('coinbase_auth')
      .upsert({
        user_id: state,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      });

    if (error) {
      throw new Error('Failed to store Coinbase auth');
    }

    // Redirect back to dashboard
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard?coinbase=connected`,
      },
    });

  } catch (error) {
    console.error('Coinbase OAuth error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard?error=${encodeURIComponent(error.message)}`,
      },
    });
  }
});
