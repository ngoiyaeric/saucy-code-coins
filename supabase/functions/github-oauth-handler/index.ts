import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user session
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the request body to see if token was passed
    const body = await req.json().catch(() => ({}))
    const providedToken = body.github_token

    if (providedToken) {
      console.log('Using provided GitHub token')
      await storeGithubToken(supabaseClient, user.id, providedToken)
      return new Response(JSON.stringify({ success: true, message: 'GitHub token stored successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Try to get from user metadata
    const providerToken = user.user_metadata?.provider_token || 
                         user.app_metadata?.provider_token ||
                         user.identities?.[0]?.identity_data?.provider_token

    console.log('User metadata check:', {
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
      identities: user.identities?.map(id => ({ 
        provider: id.provider, 
        identity_data_keys: Object.keys(id.identity_data || {}) 
      }))
    })

    if (!providerToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No GitHub access token found. Please re-authenticate.',
        debug: {
          user_id: user.id,
          identities_count: user.identities?.length || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Store the GitHub access token
    await storeGithubToken(supabaseClient, user.id, providerToken)

    return new Response(JSON.stringify({ success: true, message: 'GitHub token stored successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in github-oauth-handler:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to store GitHub access token'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function storeGithubToken(supabaseClient: any, userId: string, accessToken: string) {
  // First check if the user already has a GitHub auth record
  const { data: existing } = await supabaseClient
    .from('github_auth')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabaseClient
      .from('github_auth')
      .update({
        access_token: accessToken,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating GitHub auth:', error)
      throw new Error('Failed to update GitHub authentication')
    }
  } else {
    // Insert new record
    const { error } = await supabaseClient
      .from('github_auth')
      .insert({
        user_id: userId,
        access_token: accessToken
      })

    if (error) {
      console.error('Error inserting GitHub auth:', error)
      throw new Error('Failed to store GitHub authentication')
    }
  }

  console.log('GitHub token stored successfully for user:', userId)
}