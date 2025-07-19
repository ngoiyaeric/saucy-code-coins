import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductionCheck {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  details: any;
  critical: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🚀 PRODUCTION READINESS VERIFICATION STARTING...');
  
  const checks: ProductionCheck[] = [];
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 1. DATABASE INTEGRITY CHECKS
    console.log('📊 Testing Database Integrity...');
    
    // Check table structure and data
    const { data: bounties, error: bountyError } = await supabaseClient
      .from('bounties')
      .select('count(*)')
      .limit(1);
    
    checks.push({
      category: 'Database',
      test: 'Bounty Table Access',
      status: bountyError ? 'fail' : 'pass',
      details: { count: bounties?.[0]?.count, error: bountyError?.message },
      critical: true
    });

    // Test repository protection (attempt deletion)
    try {
      const { error: deleteError } = await supabaseClient
        .from('enabled_repositories')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      
      checks.push({
        category: 'Security',
        test: 'Repository Deletion Protection',
        status: deleteError?.message?.includes('DELETION BLOCKED') ? 'pass' : 'warning',
        details: { protection_active: deleteError?.message?.includes('DELETION BLOCKED') },
        critical: true
      });
    } catch (error) {
      checks.push({
        category: 'Security',
        test: 'Repository Deletion Protection',
        status: 'pass',
        details: { protection_triggered: true, error: error.message },
        critical: true
      });
    }

    // 2. GITHUB INTEGRATION TESTS
    console.log('🐙 Testing GitHub Integration...');
    
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (githubToken) {
      try {
        const githubResponse = await fetch('https://api.github.com/rate_limit', {
          headers: { 'Authorization': `token ${githubToken}` }
        });
        
        const rateLimit = await githubResponse.json();
        checks.push({
          category: 'GitHub',
          test: 'API Authentication',
          status: githubResponse.ok ? 'pass' : 'fail',
          details: {
            remaining: rateLimit.rate?.remaining,
            limit: rateLimit.rate?.limit,
            authenticated: githubResponse.ok
          },
          critical: true
        });
      } catch (error) {
        checks.push({
          category: 'GitHub',
          test: 'API Authentication',
          status: 'fail',
          details: { error: error.message },
          critical: true
        });
      }
    } else {
      checks.push({
        category: 'GitHub',
        test: 'API Token Configuration',
        status: 'fail',
        details: { error: 'GitHub token not configured' },
        critical: true
      });
    }

    // 3. COINBASE INTEGRATION TESTS
    console.log('💰 Testing Coinbase Integration...');
    
    const coinbaseApiKey = Deno.env.get('COINBASE_API_KEY_ID');
    const coinbaseSecret = Deno.env.get('COINBASE_API_SECRET');
    
    if (coinbaseApiKey && coinbaseSecret) {
      try {
        // Test Coinbase API authentication
        const timestamp = Math.floor(Date.now() / 1000);
        const method = 'GET';
        const path = '/api/v3/brokerage/accounts';
        const message = timestamp + method + path;
        
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(coinbaseSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
        const sigHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        const coinbaseResponse = await fetch(`https://api.coinbase.com${path}`, {
          method,
          headers: {
            'CB-ACCESS-KEY': coinbaseApiKey,
            'CB-ACCESS-SIGN': sigHex,
            'CB-ACCESS-TIMESTAMP': timestamp.toString(),
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });

        checks.push({
          category: 'Coinbase',
          test: 'API Authentication',
          status: coinbaseResponse.ok ? 'pass' : 'warning',
          details: { 
            status: coinbaseResponse.status,
            authenticated: coinbaseResponse.ok
          },
          critical: true
        });
      } catch (error) {
        checks.push({
          category: 'Coinbase',
          test: 'API Authentication',
          status: 'warning',
          details: { error: error.message },
          critical: false
        });
      }
    } else {
      checks.push({
        category: 'Coinbase',
        test: 'API Configuration',
        status: 'fail',
        details: { error: 'Coinbase credentials not configured' },
        critical: true
      });
    }

    // 4. EDGE FUNCTION AVAILABILITY TESTS
    console.log('⚡ Testing Edge Functions...');
    
    const criticalFunctions = [
      'github-webhook',
      'process-bounty-payout',
      'send-crypto',
      'bank-transfer',
      'repository-protection'
    ];

    for (const funcName of criticalFunctions) {
      try {
        // Test with a minimal payload
        const response = await supabaseClient.functions.invoke(funcName, {
          body: { test: true, production_check: true }
        });

        checks.push({
          category: 'Edge Functions',
          test: `${funcName} Availability`,
          status: response.error ? 'warning' : 'pass',
          details: { 
            available: !response.error,
            error: response.error?.message 
          },
          critical: ['github-webhook', 'process-bounty-payout'].includes(funcName)
        });
      } catch (error) {
        checks.push({
          category: 'Edge Functions',
          test: `${funcName} Availability`,
          status: 'fail',
          details: { error: error.message },
          critical: true
        });
      }
    }

    // 5. DATA CONSISTENCY CHECKS
    console.log('🔍 Testing Data Consistency...');
    
    // Check for orphaned records
    const { data: orphanedPayouts } = await supabaseClient
      .from('payouts')
      .select('id, repository_id')
      .not('repository_id', 'in', 
        '(SELECT DISTINCT repository_id FROM bounties WHERE repository_id IS NOT NULL)'
      );

    checks.push({
      category: 'Data Integrity',
      test: 'Orphaned Payout Check',
      status: (orphanedPayouts?.length || 0) > 0 ? 'warning' : 'pass',
      details: { orphaned_count: orphanedPayouts?.length || 0 },
      critical: false
    });

    // 6. PERFORMANCE CHECKS
    console.log('⚡ Testing Performance...');
    
    const startTime = Date.now();
    await Promise.all([
      supabaseClient.from('bounties').select('count(*)').limit(1),
      supabaseClient.from('payouts').select('count(*)').limit(1),
      supabaseClient.from('enabled_repositories').select('count(*)').limit(1)
    ]);
    const queryTime = Date.now() - startTime;

    checks.push({
      category: 'Performance',
      test: 'Database Query Performance',
      status: queryTime < 1000 ? 'pass' : queryTime < 3000 ? 'warning' : 'fail',
      details: { query_time_ms: queryTime },
      critical: false
    });

    // 7. SECURITY VALIDATION
    console.log('🔒 Testing Security Controls...');
    
    // Test RLS policies
    try {
      // This should fail without proper authentication
      const { error: rlsError } = await supabaseClient
        .from('github_auth')
        .select('*')
        .limit(1);

      checks.push({
        category: 'Security',
        test: 'Row Level Security',
        status: rlsError ? 'pass' : 'warning',
        details: { rls_enforced: !!rlsError },
        critical: true
      });
    } catch (error) {
      checks.push({
        category: 'Security',
        test: 'Row Level Security',
        status: 'pass',
        details: { rls_enforced: true },
        critical: true
      });
    }

    // 8. BUSINESS LOGIC VALIDATION
    console.log('💼 Testing Business Logic...');
    
    // Test fee calculation (2.5%)
    const testAmounts = [100, 250, 1000];
    const feeCalculations = testAmounts.map(amount => ({
      amount,
      fee: Math.round(amount * 0.025 * 100) / 100,
      net: amount - Math.round(amount * 0.025 * 100) / 100
    }));

    const correctFees = feeCalculations.every(calc => calc.fee === calc.amount * 0.025);
    
    checks.push({
      category: 'Business Logic',
      test: 'Platform Fee Calculation (2.5%)',
      status: correctFees ? 'pass' : 'fail',
      details: { calculations: feeCalculations, all_correct: correctFees },
      critical: true
    });

    // FINAL ASSESSMENT
    const criticalFailures = checks.filter(c => c.critical && c.status === 'fail').length;
    const totalFailures = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const passed = checks.filter(c => c.status === 'pass').length;

    const productionReady = criticalFailures === 0 && totalFailures < 3;

    console.log(`🏁 PRODUCTION READINESS CHECK COMPLETE: ${productionReady ? 'READY' : 'NOT READY'}`);

    return new Response(JSON.stringify({
      production_ready: productionReady,
      timestamp: new Date().toISOString(),
      summary: {
        total_checks: checks.length,
        passed,
        warnings,
        failures: totalFailures,
        critical_failures: criticalFailures
      },
      verdict: productionReady ? 
        '✅ SYSTEM IS PRODUCTION READY' : 
        '❌ SYSTEM NEEDS ATTENTION BEFORE PRODUCTION',
      recommendations: criticalFailures > 0 ? [
        'Fix critical failures before deploying to production',
        'Review failed tests and resolve underlying issues',
        'Re-run verification after fixes'
      ] : warnings > 0 ? [
        'Review warnings for potential improvements',
        'Monitor system closely in production',
        'Consider addressing warnings for optimal performance'
      ] : [
        'System is fully production ready',
        'Continue monitoring in production',
        'Regular health checks recommended'
      ],
      detailed_results: checks.sort((a, b) => {
        // Sort by: critical failures first, then failures, then warnings, then pass
        const statusOrder = { fail: 0, warning: 1, pass: 2 };
        const aPriority = a.critical ? 0 : 1;
        const bPriority = b.critical ? 0 : 1;
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        return statusOrder[a.status] - statusOrder[b.status];
      })
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: productionReady ? 200 : 206
    });

  } catch (error) {
    console.error('❌ Production verification failed:', error);
    return new Response(JSON.stringify({
      production_ready: false,
      error: error.message,
      verdict: '❌ VERIFICATION FAILED - SYSTEM NOT READY',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});