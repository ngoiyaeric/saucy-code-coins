
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
    return session?.provider_token || null;
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
      },
    });

    if (!response.ok) {
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
      const issues = await this.makeGitHubRequest(
        `https://api.github.com/repos/${repoFullName}/issues?state=${state}&per_page=100`
      );
      console.log(`Repository ${repoFullName} issues:`, issues);
      
      // Ensure issues is an array before filtering
      if (!Array.isArray(issues)) {
        console.warn(`Expected array of issues for ${repoFullName}, got:`, typeof issues);
        return [];
      }
      
      // Filter out PRs and ensure we have valid issue objects
      return issues.filter((issue: any) => {
        if (!issue || typeof issue !== 'object') {
          console.warn('Invalid issue object:', issue);
          return false;
        }
        return !issue.pull_request; // Filter out PRs
      });
    } catch (error) {
      console.error(`Error fetching issues for repository ${repoFullName}:`, error);
      // Return empty array instead of throwing to allow parsing to continue
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
  }>> {
    const results = [];
    
    for (const repo of repositories.slice(0, 5)) { // Limit to first 5 repos to avoid rate limits
      try {
        const issues = await this.getRepositoryIssues(repo.full_name);
        const bountyAssignments = await Promise.all(
          issues.map(issue => this.analyzeBountyValue(issue))
        );
        
        results.push({
          repository: repo,
          issues,
          bountyAssignments
        });
      } catch (error) {
        console.warn(`Failed to process repository ${repo.full_name}:`, error);
      }
    }
    
    return results;
  }
}
