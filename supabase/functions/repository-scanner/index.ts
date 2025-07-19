import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  open_issues_count: number;
  language: string | null;
  owner: {
    login: string;
    type: string;
  };
}

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string; color: string }>;
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
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

    const { searchQuery, minStars = 10, maxResults = 50 } = await req.json();

    console.log('Scanning for public repositories with issues:', { searchQuery, minStars, maxResults });

    // Search for public repositories with open issues
    const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}+is:public+has:issues+stars:>=${minStars}&sort=stars&order=desc&per_page=${Math.min(maxResults, 100)}`;
    
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Saucy-Repository-Scanner'
    };

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    const response = await fetch(searchUrl, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const searchResults = await response.json();
    const repositories: Repository[] = searchResults.items || [];

    console.log(`Found ${repositories.length} public repositories`);

    const repositoriesWithIssues = [];

    // Process each repository to get issues
    for (const repo of repositories.slice(0, Math.min(maxResults, 25))) {
      try {
        // Only process public repositories
        if (repo.private) {
          console.log(`Skipping private repository: ${repo.full_name}`);
          continue;
        }

        // Get open issues for this repository
        const issuesUrl = `https://api.github.com/repos/${repo.full_name}/issues?state=open&per_page=10&sort=created&direction=desc`;
        const issuesResponse = await fetch(issuesUrl, { headers });

        if (!issuesResponse.ok) {
          console.warn(`Failed to fetch issues for ${repo.full_name}: ${issuesResponse.status}`);
          continue;
        }

        const issues: Issue[] = await issuesResponse.json();
        
        // Filter out pull requests (they have pull_request property)
        const actualIssues = issues.filter(issue => !('pull_request' in issue));

        if (actualIssues.length === 0) {
          console.log(`No open issues found for ${repo.full_name}`);
          continue;
        }

        // Store repository data
        await supabaseClient
          .from('public_repositories')
          .upsert({
            repository_id: repo.id.toString(),
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            html_url: repo.html_url,
            stargazers_count: repo.stargazers_count,
            open_issues_count: repo.open_issues_count,
            language: repo.language,
            owner_login: repo.owner.login,
            owner_type: repo.owner.type,
            last_scanned: new Date().toISOString()
          }, {
            onConflict: 'repository_id'
          });

        // Store issues data
        for (const issue of actualIssues) {
          await supabaseClient
            .from('public_issues')
            .upsert({
              issue_id: issue.id.toString(),
              repository_id: repo.id.toString(),
              number: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              labels: issue.labels,
              comments_count: issue.comments,
              html_url: issue.html_url,
              created_at: issue.created_at,
              updated_at: issue.updated_at,
              complexity: analyzeIssueComplexity(issue),
              suggested_bounty: calculateSuggestedBounty(issue, repo)
            }, {
              onConflict: 'issue_id'
            });
        }

        repositoriesWithIssues.push({
          repository: repo,
          issues: actualIssues,
          issueCount: actualIssues.length
        });

        console.log(`✅ Processed ${repo.full_name}: ${actualIssues.length} issues`);

        // Rate limiting - GitHub allows 5000 requests per hour for authenticated requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing repository ${repo.full_name}:`, error);
        continue;
      }
    }

    console.log(`Successfully processed ${repositoriesWithIssues.length} repositories with issues`);

    return new Response(JSON.stringify({
      success: true,
      totalFound: repositories.length,
      processed: repositoriesWithIssues.length,
      repositories: repositoriesWithIssues.map(r => ({
        repository: {
          id: r.repository.id,
          name: r.repository.name,
          full_name: r.repository.full_name,
          description: r.repository.description,
          stargazers_count: r.repository.stargazers_count,
          open_issues_count: r.repository.open_issues_count,
          language: r.repository.language,
          html_url: r.repository.html_url
        },
        issueCount: r.issueCount
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error scanning repositories:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeIssueComplexity(issue: Issue): 'low' | 'medium' | 'high' | 'critical' {
  const title = issue.title.toLowerCase();
  const body = (issue.body || '').toLowerCase();
  const labelNames = issue.labels.map(l => l.name.toLowerCase());

  // Check for critical indicators
  if (labelNames.some(label => ['critical', 'urgent', 'security', 'breaking'].includes(label)) ||
      title.includes('security') || title.includes('critical') || title.includes('urgent')) {
    return 'critical';
  }

  // Check for high complexity indicators
  if (labelNames.some(label => ['feature', 'enhancement', 'major', 'epic'].includes(label)) ||
      title.includes('feature') || title.includes('enhancement') ||
      (issue.body && issue.body.length > 1000)) {
    return 'high';
  }

  // Check for low complexity indicators
  if (labelNames.some(label => ['documentation', 'typo', 'good first issue', 'easy', 'beginner'].includes(label)) ||
      title.includes('typo') || title.includes('docs') || title.includes('documentation')) {
    return 'low';
  }

  // Default to medium complexity
  return 'medium';
}

function calculateSuggestedBounty(issue: Issue, repo: Repository): number {
  const complexity = analyzeIssueComplexity(issue);
  let baseAmount = 50;

  // Adjust base amount by complexity
  switch (complexity) {
    case 'critical':
      baseAmount = 500;
      break;
    case 'high':
      baseAmount = 200;
      break;
    case 'medium':
      baseAmount = 100;
      break;
    case 'low':
      baseAmount = 25;
      break;
  }

  // Adjust by repository popularity
  if (repo.stargazers_count > 10000) {
    baseAmount *= 2;
  } else if (repo.stargazers_count > 1000) {
    baseAmount *= 1.5;
  } else if (repo.stargazers_count > 100) {
    baseAmount *= 1.2;
  }

  // Adjust by comment activity
  if (issue.comments > 10) {
    baseAmount *= 1.5;
  } else if (issue.comments > 5) {
    baseAmount *= 1.2;
  }

  // Round to nearest $5
  return Math.round(baseAmount / 5) * 5;
}