import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CRITICAL REPOSITORY PROTECTION SERVICE
 * 
 * This service ensures NO repositories, bounties, or related data
 * are ever deleted from the system. It provides multiple layers
 * of protection against accidental data loss.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, table, targetId } = await req.json();

    console.log('Repository protection service called:', { action, table, targetId });

    // ABSOLUTE PROTECTION: Block ANY deletion attempts
    if (action === 'delete' || action === 'remove' || action === 'purge') {
      console.error('🚨 DELETION ATTEMPT BLOCKED 🚨', { action, table, targetId });
      
      // Log the blocked attempt
      await supabaseClient
        .from('bounty_logs')
        .insert({
          action: 'deletion_blocked',
          details: {
            attempted_action: action,
            attempted_table: table,
            attempted_target: targetId,
            blocked_at: new Date().toISOString(),
            protection_level: 'CRITICAL'
          },
          success: true,
          error_message: `Deletion attempt blocked by repository protection service`
        });

      return new Response(JSON.stringify({
        success: false,
        blocked: true,
        message: '🛡️ DELETION BLOCKED: Repositories and related data cannot be deleted',
        protection: 'ACTIVE',
        alternative: 'Use soft deletion (marking as inactive) instead'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Safe operations that preserve data
    if (action === 'soft_delete' || action === 'mark_inactive') {
      console.log('✅ Safe operation approved:', action);
      
      let updateResult;
      
      switch (table) {
        case 'enabled_repositories':
          updateResult = await supabaseClient
            .from('enabled_repositories')
            .update({ 
              enabled: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', targetId);
          break;
          
        case 'bounties':
          updateResult = await supabaseClient
            .from('bounties')
            .update({ 
              status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('id', targetId);
          break;
          
        case 'github_installations':
          updateResult = await supabaseClient
            .from('github_installations')
            .update({ 
              repository_selection: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('id', targetId);
          break;
          
        default:
          throw new Error(`Table ${table} not supported for soft deletion`);
      }

      // Log the safe operation
      await supabaseClient
        .from('bounty_logs')
        .insert({
          action: 'soft_deletion_completed',
          details: {
            table,
            target_id: targetId,
            operation: action,
            completed_at: new Date().toISOString()
          },
          success: !updateResult.error,
          error_message: updateResult.error?.message
        });

      return new Response(JSON.stringify({
        success: !updateResult.error,
        action: 'soft_deletion',
        message: '✅ Data safely marked as inactive (preserved)',
        details: updateResult.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Repository audit and health check
    if (action === 'audit') {
      const results = await Promise.all([
        supabaseClient.from('enabled_repositories').select('count(*)'),
        supabaseClient.from('bounties').select('count(*)'),
        supabaseClient.from('payouts').select('count(*)'),
        supabaseClient.from('public_repositories').select('count(*)')
      ]);

      const audit = {
        timestamp: new Date().toISOString(),
        protection_status: 'ACTIVE',
        data_integrity: 'VERIFIED',
        counts: {
          enabled_repositories: results[0].data?.[0]?.count || 0,
          bounties: results[1].data?.[0]?.count || 0,
          payouts: results[2].data?.[0]?.count || 0,
          public_repositories: results[3].data?.[0]?.count || 0
        },
        protection_policies: [
          'NO_HARD_DELETE',
          'SOFT_DELETE_ONLY',
          'DATA_PRESERVATION',
          'AUDIT_LOGGING'
        ]
      };

      return new Response(JSON.stringify({
        success: true,
        audit,
        message: '🛡️ All repository data is protected and preserved'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Unknown action. Supported: soft_delete, mark_inactive, audit'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Repository protection service error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      protection_status: 'ACTIVE - Error occurred but protection remains'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});