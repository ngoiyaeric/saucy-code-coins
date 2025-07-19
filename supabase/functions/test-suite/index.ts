import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  details?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { testSuite = 'all' } = await req.json();
  console.log(`Running test suite: ${testSuite}`);

  const results: TestResult[] = [];
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Test 1: Database Connection and Basic Operations
    if (testSuite === 'all' || testSuite === 'database') {
      const start = Date.now();
      try {
        // Test bounty creation
        const testBounty = {
          repository_id: 'test-repo-123',
          repository_name: 'test/repo',
          issue_id: 'test-issue-456',
          issue_number: 1,
          issue_title: 'Test Issue',
          amount: 100,
          currency: 'USD',
          complexity: 'medium',
          creator_id: '00000000-0000-0000-0000-000000000000', // Test UUID
          status: 'active'
        };

        const { data: bounty, error: bountyError } = await supabaseClient
          .from('bounties')
          .insert(testBounty)
          .select()
          .single();

        if (bountyError) throw bountyError;

        // Clean up test data
        await supabaseClient
          .from('bounties')
          .delete()
          .eq('id', bounty.id);

        results.push({
          name: 'Database CRUD Operations',
          status: 'pass',
          duration: Date.now() - start,
          details: { bountyId: bounty.id }
        });
      } catch (error) {
        results.push({
          name: 'Database CRUD Operations',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        });
      }
    }

    // Test 2: GitHub Webhook Processing
    if (testSuite === 'all' || testSuite === 'webhook') {
      const start = Date.now();
      try {
        const mockWebhookPayload = {
          action: 'closed',
          pull_request: {
            id: 123456,
            number: 42,
            merged: true,
            title: 'Fix issue #1',
            body: 'This PR fixes #1 and resolves the problem',
            user: {
              id: 789,
              login: 'testuser'
            }
          },
          repository: {
            id: 987654,
            full_name: 'test/repo'
          }
        };

        // Test webhook processing without actually calling external APIs
        const issueNumbers = extractIssueNumbers(
          mockWebhookPayload.pull_request.body + ' ' + mockWebhookPayload.pull_request.title
        );

        if (issueNumbers.length === 0) {
          throw new Error('Failed to extract issue numbers from PR');
        }

        results.push({
          name: 'GitHub Webhook Processing',
          status: 'pass',
          duration: Date.now() - start,
          details: { extractedIssues: issueNumbers }
        });
      } catch (error) {
        results.push({
          name: 'GitHub Webhook Processing',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        });
      }
    }

    // Test 3: Bounty Calculation Logic
    if (testSuite === 'all' || testSuite === 'bounty') {
      const start = Date.now();
      try {
        const testIssues = [
          {
            labels: [{ name: 'critical', color: 'red' }],
            comments: 15,
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            labels: [{ name: 'good first issue', color: 'green' }],
            comments: 2,
            created_at: new Date().toISOString()
          },
          {
            labels: [{ name: 'feature', color: 'blue' }],
            comments: 8,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

        const calculations = testIssues.map(issue => calculateTestBounty(issue));
        
        // Verify calculations are reasonable
        if (calculations[0] < 300) throw new Error('Critical issue bounty too low');
        if (calculations[1] > 50) throw new Error('Good first issue bounty too high');
        if (calculations[2] < 100) throw new Error('Feature bounty too low');

        results.push({
          name: 'Bounty Calculation Logic',
          status: 'pass',
          duration: Date.now() - start,
          details: { calculations }
        });
      } catch (error) {
        results.push({
          name: 'Bounty Calculation Logic',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        });
      }
    }

    // Test 4: Payout Processing Logic
    if (testSuite === 'all' || testSuite === 'payout') {
      const start = Date.now();
      try {
        // Test fee calculation
        const testAmounts = [100, 250, 1000];
        const fees = testAmounts.map(amount => calculatePlatformFee(amount));
        
        // Verify 2.5% fee calculation
        const expectedFees = [2.5, 6.25, 25];
        for (let i = 0; i < fees.length; i++) {
          if (Math.abs(fees[i] - expectedFees[i]) > 0.01) {
            throw new Error(`Fee calculation incorrect for amount ${testAmounts[i]}`);
          }
        }

        results.push({
          name: 'Payout Fee Calculation',
          status: 'pass',
          duration: Date.now() - start,
          details: { testAmounts, calculatedFees: fees }
        });
      } catch (error) {
        results.push({
          name: 'Payout Fee Calculation',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        });
      }
    }

    // Test 5: Error Handling and Edge Cases
    if (testSuite === 'all' || testSuite === 'edge-cases') {
      const start = Date.now();
      try {
        // Test invalid database operations
        const { error: invalidError } = await supabaseClient
          .from('bounties')
          .insert({
            // Missing required fields to test validation
            repository_id: 'test'
          });

        if (!invalidError) {
          throw new Error('Expected validation error for invalid bounty data');
        }

        // Test issue number extraction edge cases
        const edgeCases = [
          'No issues mentioned here',
          'This fixes #123 and also resolves #456',
          'Closes #0 (invalid)',
          'Fixes issue number 789 (no hash)',
          '#999 at the beginning'
        ];

        const extractions = edgeCases.map(text => extractIssueNumbers(text));
        
        // Verify edge case handling
        if (extractions[0].length !== 0) throw new Error('Should not extract from text with no issues');
        if (extractions[1].length !== 2) throw new Error('Should extract two issue numbers');
        if (extractions[2].length !== 0) throw new Error('Should not extract issue #0');

        results.push({
          name: 'Error Handling and Edge Cases',
          status: 'pass',
          duration: Date.now() - start,
          details: { edgeCaseResults: extractions }
        });
      } catch (error) {
        results.push({
          name: 'Error Handling and Edge Cases',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        });
      }
    }

    // Test 6: Rate Limiting and Performance
    if (testSuite === 'all' || testSuite === 'performance') {
      const start = Date.now();
      try {
        const concurrentRequests = 5;
        const promises = [];

        for (let i = 0; i < concurrentRequests; i++) {
          promises.push(
            supabaseClient
              .from('bounties')
              .select('count(*)')
              .limit(1)
          );
        }

        const results_perf = await Promise.all(promises);
        const duration = Date.now() - start;

        if (duration > 5000) {
          throw new Error(`Performance test took too long: ${duration}ms`);
        }

        results.push({
          name: 'Concurrent Request Performance',
          status: 'pass',
          duration,
          details: { concurrentRequests, avgResponseTime: duration / concurrentRequests }
        });
      } catch (error) {
        results.push({
          name: 'Concurrent Request Performance',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        });
      }
    }

    // Calculate overall results
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return new Response(JSON.stringify({
      success: failed === 0,
      summary: {
        total: results.length,
        passed,
        failed,
        skipped,
        duration: totalDuration,
        successRate: Math.round((passed / results.length) * 100)
      },
      results,
      timestamp: new Date().toISOString()
    }), {
      status: failed === 0 ? 200 : 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Test suite execution failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results,
      timestamp: new Date().toISOString()
    }), {
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

function calculateTestBounty(issue: any): number {
  let baseAmount = 50;
  const labelNames = issue.labels.map((l: any) => l.name.toLowerCase());
  
  if (labelNames.includes('critical')) {
    baseAmount = 500;
  } else if (labelNames.includes('feature')) {
    baseAmount = 200;
  } else if (labelNames.includes('good first issue')) {
    baseAmount = 25;
  }
  
  if (issue.comments > 10) {
    baseAmount *= 1.5;
  }
  
  const daysOld = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24));
  if (daysOld > 30) {
    baseAmount *= 1.3;
  }
  
  return Math.round(baseAmount);
}

function calculatePlatformFee(amount: number): number {
  return Math.round(amount * 0.025 * 100) / 100; // 2.5% fee, rounded to 2 decimal places
}