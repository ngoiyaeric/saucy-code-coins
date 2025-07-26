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

    // Get the user session from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user.user) {
      throw new Error('Invalid user token');
    }

    console.log('User authenticated:', user.user.email);

    // Check if user already has GitHub auth stored
    const { data: existingAuth } = await supabaseClient
      .from('github_auth')
      .select('id')
      .eq('user_id', user.user.id)
      .single();

    if (existingAuth) {
      console.log('GitHub auth already exists for user');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'GitHub auth already exists',
        hasAuth: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the user's provider token from Supabase Auth
    // This requires the service role key to access the auth admin endpoints
    const { data: userWithProviders, error: providersError } = await supabaseClient.auth.admin.getUserById(user.user.id);
    
    if (providersError) {
      console.error('Error getting user providers:', providersError);
      throw providersError;
    }

    console.log('User identities:', userWithProviders.user?.identities);

    // Find the GitHub identity
    const githubIdentity = userWithProviders.user?.identities?.find(
      (identity: any) => identity.provider === 'github'
    );

    if (!githubIdentity) {
      throw new Error('No GitHub identity found for user');
    }

    // For GitHub OAuth via Supabase, we need to use the session access token
    // The provider_token is not available in identity data for security reasons
    // Instead, we'll store a flag indicating GitHub auth completion
    console.log('GitHub identity found, marking as authenticated');
    
    // We'll use the user's session token as the GitHub access indicator
    // In production, you'd typically implement a proper GitHub OAuth flow
    // that stores the actual GitHub access token separately

    console.log('Storing GitHub authentication record...');

    // Store the GitHub auth data with a placeholder token
    // Note: For proper GitHub API access, implement a separate OAuth flow
    const { error: insertError } = await supabaseClient
      .from('github_auth')
      .insert({
        user_id: user.user.id,
        access_token: `github_session_${user.user.id}`, // Placeholder - implement proper OAuth
        refresh_token: null,
        expires_at: null,
      });

    if (insertError) {
      console.error('Error storing GitHub auth:', insertError);
      throw insertError;
    }

    console.log('Successfully stored GitHub auth for user:', user.user.email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'GitHub auth captured and stored',
      hasAuth: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error capturing GitHub token:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      hasAuth: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});