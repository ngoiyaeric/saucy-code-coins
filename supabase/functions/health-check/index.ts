import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: HealthCheckResult[] = [];

  try {
    // Check Supabase Database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const dbStart = Date.now();
    try {
      const { data, error } = await supabaseClient
        .from('bounties')
        .select('count(*)')
        .limit(1);
      
      checks.push({
        service: 'database',
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - dbStart,
        error: error?.message,
        details: { bountyCount: data?.[0]?.count || 0 }
      });
    } catch (error) {
      checks.push({
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        error: error.message
      });
    }

    // Check GitHub API
    const githubStart = Date.now();
    try {
      const githubToken = Deno.env.get('GITHUB_TOKEN');
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Saucy-Health-Check'
      };
      
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      const response = await fetch('https://api.github.com/rate_limit', { 
        headers,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const rateLimit = await response.json();
      
      checks.push({
        service: 'github_api',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - githubStart,
        details: {
          remaining: rateLimit.rate?.remaining,
          limit: rateLimit.rate?.limit,
          reset: rateLimit.rate?.reset
        }
      });
    } catch (error) {
      checks.push({
        service: 'github_api',
        status: 'unhealthy',
        responseTime: Date.now() - githubStart,
        error: error.message
      });
    }

    // Check Coinbase API
    const coinbaseStart = Date.now();
    try {
      const coinbaseApiKey = Deno.env.get('COINBASE_API_KEY_ID');
      const coinbaseSecret = Deno.env.get('COINBASE_API_SECRET');
      
      if (!coinbaseApiKey || !coinbaseSecret) {
        checks.push({
          service: 'coinbase_api',
          status: 'degraded',
          responseTime: Date.now() - coinbaseStart,
          error: 'Coinbase credentials not configured'
        });
      } else {
        // Test Coinbase connection with a simple API call
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

        const response = await fetch(`https://api.coinbase.com${path}`, {
          method,
          headers: {
            'CB-ACCESS-KEY': coinbaseApiKey,
            'CB-ACCESS-SIGN': sigHex,
            'CB-ACCESS-TIMESTAMP': timestamp.toString(),
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        checks.push({
          service: 'coinbase_api',
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - coinbaseStart,
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      checks.push({
        service: 'coinbase_api',
        status: 'unhealthy',
        responseTime: Date.now() - coinbaseStart,
        error: error.message
      });
    }

    // Check critical edge functions
    const functionsStart = Date.now();
    try {
      const testResponse = await supabaseClient.functions.invoke('process-bounty-payout', {
        body: { test: true }
      });

      checks.push({
        service: 'edge_functions',
        status: testResponse.error ? 'degraded' : 'healthy',
        responseTime: Date.now() - functionsStart,
        error: testResponse.error?.message
      });
    } catch (error) {
      checks.push({
        service: 'edge_functions',
        status: 'unhealthy',
        responseTime: Date.now() - functionsStart,
        error: error.message
      });
    }

    // Overall health assessment
    const unhealthyServices = checks.filter(c => c.status === 'unhealthy').length;
    const degradedServices = checks.filter(c => c.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    const totalResponseTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalResponseTime,
      services: checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(c => c.status === 'healthy').length,
        degraded: checks.filter(c => c.status === 'degraded').length,
        unhealthy: checks.filter(c => c.status === 'unhealthy').length
      }
    }), {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      totalResponseTime: Date.now() - startTime,
      error: error.message,
      services: checks
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});