import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: string[];
  comments: number;
  created_at: string;
}

interface BountyAssignment {
  issueId: number;
  complexity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAmount: number;
  confidence: number;
  reasoning: string;
}

function analyzeIssueComplexity(issue: Issue): BountyAssignment {
  let complexity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let baseAmount = 50;
  let confidence = 0.7;
  let reasoning = '';

  // Analyze labels for complexity indicators
  const labels = issue.labels.map(label => label.toLowerCase());
  const criticalLabels = ['critical', 'security', 'breaking', 'urgent', 'p0'];
  const highLabels = ['high', 'important', 'feature', 'enhancement', 'p1'];
  const lowLabels = ['documentation', 'good first issue', 'beginner', 'easy', 'p3'];

  if (labels.some(label => criticalLabels.some(critical => label.includes(critical)))) {
    complexity = 'critical';
    baseAmount = 200;
    confidence = 0.9;
    reasoning = 'Critical issue detected from labels. High priority and likely complex.';
  } else if (labels.some(label => highLabels.some(high => label.includes(high)))) {
    complexity = 'high';
    baseAmount = 100;
    confidence = 0.8;
    reasoning = 'High priority issue or feature request. Moderate to high complexity expected.';
  } else if (labels.some(label => lowLabels.some(low => label.includes(low)))) {
    complexity = 'low';
    baseAmount = 25;
    confidence = 0.85;
    reasoning = 'Good first issue or documentation task. Lower complexity expected.';
  }

  // Analyze title and body for complexity indicators
  const text = (issue.title + ' ' + issue.body).toLowerCase();
  
  // Technical complexity indicators
  if (text.includes('refactor') || text.includes('architecture') || text.includes('performance')) {
    if (complexity === 'medium') complexity = 'high';
    baseAmount += 25;
    reasoning += ' Technical refactoring or performance work detected.';
  }

  // Bug vs feature analysis
  if (text.includes('bug') || text.includes('error') || text.includes('broken')) {
    // Bugs might be simpler to fix
    if (complexity === 'medium') {
      baseAmount -= 10;
      reasoning += ' Bug report - potentially straightforward fix.';
    }
  }

  // Feature complexity
  if (text.includes('implement') || text.includes('add') || text.includes('create')) {
    baseAmount += 15;
    reasoning += ' New feature implementation - additional complexity.';
  }

  // Comment activity as complexity indicator
  if (issue.comments > 10) {
    baseAmount += 20;
    confidence -= 0.1;
    reasoning += ' High comment activity suggests complexity or unclear requirements.';
  } else if (issue.comments === 0) {
    confidence -= 0.2;
    reasoning += ' No discussion yet - requirements may need clarification.';
  }

  // Age factor
  const daysSinceCreated = (Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated > 30) {
    baseAmount += 10;
    reasoning += ' Long-standing issue - may have hidden complexity.';
  }

  // Ensure confidence is within bounds
  confidence = Math.max(0.3, Math.min(0.95, confidence));

  return {
    issueId: issue.id,
    complexity,
    suggestedAmount: Math.round(baseAmount),
    confidence,
    reasoning: reasoning.trim() || 'Standard complexity assessment based on available information.'
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repository, issues } = await req.json();

    if (!repository || !issues || !Array.isArray(issues)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: repository and issues array required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Analyzing ${issues.length} issues for repository: ${repository}`);

    // Analyze each issue
    const assignments: BountyAssignment[] = issues.map((issue: Issue) => {
      return analyzeIssueComplexity(issue);
    });

    // Sort by suggested amount (highest first) and complexity
    assignments.sort((a, b) => {
      const complexityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aOrder = complexityOrder[a.complexity];
      const bOrder = complexityOrder[b.complexity];
      
      if (aOrder !== bOrder) {
        return bOrder - aOrder; // Higher complexity first
      }
      
      return b.suggestedAmount - a.suggestedAmount; // Higher amount first
    });

    const totalSuggestedValue = assignments.reduce((sum, assignment) => sum + assignment.suggestedAmount, 0);
    const averageConfidence = assignments.reduce((sum, assignment) => sum + assignment.confidence, 0) / assignments.length;

    console.log(`Analysis complete: ${assignments.length} assignments, total value: $${totalSuggestedValue}`);

    return new Response(
      JSON.stringify({
        repository,
        assignments,
        summary: {
          totalIssues: issues.length,
          totalSuggestedValue,
          averageConfidence: Math.round(averageConfidence * 100) / 100,
          complexityBreakdown: {
            critical: assignments.filter(a => a.complexity === 'critical').length,
            high: assignments.filter(a => a.complexity === 'high').length,
            medium: assignments.filter(a => a.complexity === 'medium').length,
            low: assignments.filter(a => a.complexity === 'low').length,
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-issue-complexity function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});