import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IssueAnalysisRequest {
  issueUrl: string;
  repositoryId: string;
  availableBudget: number;
}

interface IssueAnalysis {
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  suggestedBounty: number;
  reasoning: string;
  estimatedHours: number;
  skillsRequired: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid authorization');
    }

    const { issueUrl, repositoryId, availableBudget }: IssueAnalysisRequest = await req.json();

    console.log('Analyzing issue:', { issueUrl, repositoryId, availableBudget });

    // Extract issue information from GitHub URL
    const urlParts = issueUrl.split('/');
    const owner = urlParts[urlParts.length - 4];
    const repo = urlParts[urlParts.length - 3];
    const issueNumber = parseInt(urlParts[urlParts.length - 1]);

    // Get GitHub access token
    const { data: githubAuth } = await supabaseClient
      .from('github_auth')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (!githubAuth) {
      throw new Error('GitHub authentication not found');
    }

    // Fetch issue details from GitHub
    const issueResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
      headers: {
        'Authorization': `Bearer ${githubAuth.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Saucy-App/1.0',
      },
    });

    if (!issueResponse.ok) {
      throw new Error('Failed to fetch issue details from GitHub');
    }

    const issue = await issueResponse.json();

    // Analyze issue complexity based on multiple factors
    const analysis = analyzeIssueComplexity(issue);
    
    // Calculate suggested bounty based on complexity and available budget
    analysis.suggestedBounty = calculateSuggestedBounty(analysis, availableBudget);

    console.log('Issue analysis completed:', analysis);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      issue: {
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        comments: issue.comments
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Issue analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeIssueComplexity(issue: any): IssueAnalysis {
  let complexityScore = 0;
  let estimatedHours = 0;
  const skillsRequired: string[] = [];
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  // Analyze title and body for complexity indicators
  const text = (issue.title + ' ' + (issue.body || '')).toLowerCase();
  
  // Technical complexity indicators
  if (text.includes('refactor') || text.includes('architecture')) {
    complexityScore += 3;
    estimatedHours += 8;
    skillsRequired.push('Architecture');
  }
  
  if (text.includes('performance') || text.includes('optimization')) {
    complexityScore += 2;
    estimatedHours += 6;
    skillsRequired.push('Performance Optimization');
  }
  
  if (text.includes('security') || text.includes('vulnerability')) {
    complexityScore += 3;
    estimatedHours += 10;
    skillsRequired.push('Security');
    priority = 'critical';
  }
  
  if (text.includes('database') || text.includes('migration')) {
    complexityScore += 2;
    estimatedHours += 4;
    skillsRequired.push('Database');
  }
  
  if (text.includes('api') || text.includes('integration')) {
    complexityScore += 2;
    estimatedHours += 5;
    skillsRequired.push('API Development');
  }
  
  if (text.includes('ui') || text.includes('frontend') || text.includes('design')) {
    complexityScore += 1;
    estimatedHours += 3;
    skillsRequired.push('Frontend');
  }
  
  if (text.includes('bug') || text.includes('fix')) {
    complexityScore += 1;
    estimatedHours += 2;
    skillsRequired.push('Debugging');
  }

  // Analyze labels for additional context
  if (issue.labels) {
    for (const label of issue.labels) {
      const labelName = label.name.toLowerCase();
      
      if (labelName.includes('critical') || labelName.includes('urgent')) {
        priority = 'critical';
        complexityScore += 1;
      } else if (labelName.includes('high')) {
        priority = 'high';
      } else if (labelName.includes('enhancement') || labelName.includes('feature')) {
        complexityScore += 2;
        estimatedHours += 4;
      } else if (labelName.includes('documentation')) {
        estimatedHours += 1;
        skillsRequired.push('Documentation');
      }
    }
  }

  // Base complexity determination
  let complexity: 'simple' | 'medium' | 'complex' | 'expert';
  if (complexityScore <= 2) {
    complexity = 'simple';
    estimatedHours = Math.max(estimatedHours, 2);
  } else if (complexityScore <= 4) {
    complexity = 'medium';
    estimatedHours = Math.max(estimatedHours, 4);
  } else if (complexityScore <= 6) {
    complexity = 'complex';
    estimatedHours = Math.max(estimatedHours, 8);
  } else {
    complexity = 'expert';
    estimatedHours = Math.max(estimatedHours, 16);
  }

  // Generate reasoning
  const reasoning = generateReasoning(complexity, skillsRequired, issue);

  return {
    complexity,
    suggestedBounty: 0, // Will be calculated separately
    reasoning,
    estimatedHours,
    skillsRequired: skillsRequired.length > 0 ? skillsRequired : ['General Development'],
    priority
  };
}

function calculateSuggestedBounty(analysis: IssueAnalysis, availableBudget: number): number {
  // Base rates per hour based on complexity
  const hourlyRates = {
    simple: 25,    // $25/hour for simple tasks
    medium: 40,    // $40/hour for medium complexity
    complex: 60,   // $60/hour for complex tasks
    expert: 100    // $100/hour for expert-level work
  };

  const baseAmount = analysis.estimatedHours * hourlyRates[analysis.complexity];
  
  // Apply priority multiplier
  const priorityMultipliers = {
    low: 0.8,
    medium: 1.0,
    high: 1.2,
    critical: 1.5
  };
  
  const suggestedAmount = baseAmount * priorityMultipliers[analysis.priority];
  
  // Cap at 30% of available budget for a single issue
  const maxAllowedBounty = availableBudget * 0.3;
  
  return Math.min(Math.round(suggestedAmount), maxAllowedBounty);
}

function generateReasoning(complexity: string, skills: string[], issue: any): string {
  const reasons = [];
  
  reasons.push(`Classified as ${complexity} complexity based on issue analysis.`);
  
  if (skills.length > 0) {
    reasons.push(`Requires skills in: ${skills.join(', ')}.`);
  }
  
  if (issue.comments > 5) {
    reasons.push(`High engagement with ${issue.comments} comments suggests community interest.`);
  }
  
  if (issue.labels && issue.labels.some((l: any) => l.name.toLowerCase().includes('good first issue'))) {
    reasons.push(`Marked as good first issue - suitable for new contributors.`);
  }
  
  const daysSinceCreated = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceCreated > 30) {
    reasons.push(`Issue has been open for ${daysSinceCreated} days - may need attention.`);
  }
  
  return reasons.join(' ');
}