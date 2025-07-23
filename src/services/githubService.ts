
import { supabase } from '@/integrations/supabase/client';

export interface GitHubOrganization {
  id: number;
  login: string;
  avatar_url: string;
  description: string | null;
  name: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    type: 'User' | 'Organization';
  };
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  permissions: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  assignee: {
    login: string;
    id: number;
    avatar_url: string;
  } | null;
  assignees: Array<{
    login: string;
    id: number;
    avatar_url: string;
  }>;
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
  };
}

export interface RepositoryIssuesResult {
  issues: GitHubIssue[];
  error?: string;
  hasError: boolean;
}

export interface BountyAssignment {
  issueId: number;
  suggestedAmount: number;
  confidence: number;
  reasoning: string;
  complexity: 'low' | 'medium' | 'high' | 'critical';
}

export class GitHubService {
  private static async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Get GitHub access token from github_auth table
    const { data: githubAuth, error } = await supabase
      .from('github_auth')
      .select('access_token')
      .eq('user_id', session.user.id)
      .single();

    if (error || !githubAuth?.access_token) {
      throw new Error('No GitHub access token found. Please sign in with GitHub first.');
    }

    return githubAuth.access_token;
  }

  private static async makeGitHubRequest(url: string): Promise<any> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No GitHub access token available');
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Saucy-App/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('GitHub API authentication failed. Please reconnect your GitHub account.');
      } else if (response.status === 404) {
        throw new Error('Repository or resource not found. Check permissions.');
      } else if (response.status === 429) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getUserOrganizations(): Promise<GitHubOrganization[]> {
    try {
      const orgs = await this.makeGitHubRequest('https://api.github.com/user/orgs');
      console.log('User organizations:', orgs);
      return orgs;
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      throw error;
    }
  }

  static async getUserRepositories(): Promise<GitHubRepository[]> {
    try {
      const repos = await this.makeGitHubRequest('https://api.github.com/user/repos?per_page=100');
      console.log('User repositories:', repos);
      return repos;
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      throw error;
    }
  }

  static async getOrganizationRepositories(org: string): Promise<GitHubRepository[]> {
    try {
      const repos = await this.makeGitHubRequest(`https://api.github.com/orgs/${org}/repos?per_page=100`);
      console.log(`Organization ${org} repositories:`, repos);
      return repos;
    } catch (error) {
      console.error(`Error fetching repositories for organization ${org}:`, error);
      throw error;
    }
  }

  static async getRepositoryIssues(repoFullName: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    try {
      console.log(`Fetching issues for repository: ${repoFullName}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const issues = await this.makeGitHubRequest(
        `https://api.github.com/repos/${repoFullName}/issues?state=${state}&per_page=100&sort=created&direction=desc`
      );
      
      console.log(`Repository ${repoFullName} raw response:`, { 
        isArray: Array.isArray(issues), 
        length: issues?.length,
        type: typeof issues 
      });
      
      // Ensure issues is an array before filtering
      if (!Array.isArray(issues)) {
        console.warn(`Expected array of issues for ${repoFullName}, got:`, typeof issues, issues);
        return [];
      }
      
      // Filter out PRs and ensure we have valid issue objects
      const validIssues = issues.filter((issue: any) => {
        if (!issue || typeof issue !== 'object') {
          console.warn('Invalid issue object:', issue);
          return false;
        }
        // Filter out PRs (they have pull_request property)
        const isPR = issue.pull_request !== undefined && issue.pull_request !== null;
        if (isPR) {
          console.log(`Filtering out PR #${issue.number}: ${issue.title}`);
        }
        return !isPR;
      });
      
      console.log(`Repository ${repoFullName} has ${validIssues.length} valid issues (filtered from ${issues.length} total)`);
      return validIssues;
    } catch (error) {
      console.error(`Error fetching issues for repository ${repoFullName}:`, error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
      }
      // Return empty array on error to allow processing to continue
      return [];
    }
  }

  static async analyzeBountyValue(issue: GitHubIssue): Promise<BountyAssignment> {
    // Intelligent bounty assignment based on issue characteristics
    let baseAmount = 50; // Base bounty amount
    let complexity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let confidence = 0.7;
    let reasoning = '';

    // Analyze labels for complexity indicators
    const complexityLabels = issue.labels.map(l => l.name.toLowerCase());
    
    if (complexityLabels.some(label => 
      ['critical', 'urgent', 'security', 'breaking'].includes(label)
    )) {
      baseAmount = 500;
      complexity = 'critical';
      confidence = 0.9;
      reasoning = 'Critical priority issue with security or breaking change implications';
    } else if (complexityLabels.some(label => 
      ['feature', 'enhancement', 'major'].includes(label)
    )) {
      baseAmount = 200;
      complexity = 'high';
      confidence = 0.8;
      reasoning = 'Major feature or enhancement requiring significant development effort';
    } else if (complexityLabels.some(label => 
      ['bug', 'improvement', 'refactor'].includes(label)
    )) {
      baseAmount = 100;
      complexity = 'medium';
      confidence = 0.8;
      reasoning = 'Standard bug fix or improvement task';
    } else if (complexityLabels.some(label => 
      ['documentation', 'typo', 'good first issue', 'easy'].includes(label)
    )) {
      baseAmount = 25;
      complexity = 'low';
      confidence = 0.9;
      reasoning = 'Simple documentation or beginner-friendly task';
    }

    // Adjust based on comment activity (more comments = more complex)
    if (issue.comments > 10) {
      baseAmount *= 1.5;
      reasoning += ' (High community engagement indicates complexity)';
    } else if (issue.comments > 5) {
      baseAmount *= 1.2;
    }

    // Adjust based on issue age (older issues might be more complex)
    const daysOld = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld > 30) {
      baseAmount *= 1.3;
      reasoning += ' (Long-standing issue suggests complexity)';
    }

    return {
      issueId: issue.id,
      suggestedAmount: Math.round(baseAmount),
      confidence,
      reasoning,
      complexity
    };
  }

  static async getAllAccessibleRepositories(): Promise<{
    userRepos: GitHubRepository[];
    orgRepos: Record<string, GitHubRepository[]>;
    organizations: GitHubOrganization[];
  }> {
    try {
      const [userRepos, organizations] = await Promise.all([
        this.getUserRepositories(),
        this.getUserOrganizations(),
      ]);

      const orgRepos: Record<string, GitHubRepository[]> = {};
      
      // Fetch repositories for each organization
      for (const org of organizations) {
        try {
          orgRepos[org.login] = await this.getOrganizationRepositories(org.login);
        } catch (error) {
          console.warn(`Failed to fetch repos for organization ${org.login}:`, error);
          orgRepos[org.login] = [];
        }
      }

      return {
        userRepos,
        orgRepos,
        organizations,
      };
    } catch (error) {
      console.error('Error fetching all accessible repositories:', error);
      throw error;
    }
  }

  static async getRepositoriesWithIssuesAndBounties(repositories: GitHubRepository[]): Promise<Array<{
    repository: GitHubRepository;
    issues: GitHubIssue[];
    bountyAssignments: BountyAssignment[];
    hasError?: boolean;
    errorMessage?: string;
  }>> {
    const results = [];
    
    console.log(`Starting to process ${repositories.length} repositories (will process first 10)`);
    
    for (const repo of repositories.slice(0, 10)) {
      console.log(`\n=== Processing repository: ${repo.full_name} ===`);
      
      try {
        // Attempt to fetch issues regardless of permissions - GitHub API will handle access control
        const issues = await this.getRepositoryIssues(repo.full_name);
        console.log(`✅ Successfully found ${issues.length} issues for ${repo.full_name}`);
        
        // Always analyze bounties, even if there are no issues (to show the repo was processed)
        const bountyAssignments = issues.length > 0 ? await Promise.all(
          issues.map(issue => this.analyzeBountyValue(issue))
        ) : [];
        
        results.push({
          repository: repo,
          issues,
          bountyAssignments,
          hasError: false
        });
        
        console.log(`✅ Repository ${repo.full_name} processed successfully with ${issues.length} issues`);
        
      } catch (error) {
        console.error(`❌ Failed to process repository ${repo.full_name}:`, error);
        
        // Always include the repo in results, even with errors
        results.push({
          repository: repo,
          issues: [],
          bountyAssignments: [],
          hasError: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      
      // Small delay between repositories to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const successCount = results.filter(r => !r.hasError).length;
    const errorCount = results.filter(r => r.hasError).length;
    console.log(`\n=== Repository Processing Complete ===`);
    console.log(`Total processed: ${results.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    return results;
  }
}
