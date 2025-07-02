
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
}
