
import { ApiResponse, Issue, Payout, PullRequest, Repository, User } from "../types";

// Base API URL - would be set from environment in a real app
const API_BASE_URL = '/api';

// Fetch helper with error handling
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // In a real app, we'd get this from a context or store
    const token = localStorage.getItem('authToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'An unknown error occurred' 
      };
    }

    return { success: true, data: data };
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network request failed' 
    };
  }
}

// Auth endpoints
export const authApi = {
  loginWithGithub: () => {
    // In a real app, redirect to GitHub OAuth
    window.location.href = `${API_BASE_URL}/auth/github`;
  },
  
  loginWithCoinbase: () => {
    // In a real app, redirect to Coinbase OAuth
    window.location.href = `${API_BASE_URL}/auth/coinbase`;
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await fetchWithAuth<null>('/auth/logout', { method: 'POST' });
    if (response.success) {
      localStorage.removeItem('authToken');
    }
    return response;
  },
  
  getCurrentUser: () => fetchWithAuth<User>('/auth/me'),
};

// Repository endpoints
export const repositoryApi = {
  listRepositories: () => fetchWithAuth<Repository[]>('/repositories'),
  
  getRepository: (id: string) => fetchWithAuth<Repository>(`/repositories/${id}`),
  
  enableRepository: (id: string) => 
    fetchWithAuth<Repository>(`/repositories/${id}/enable`, { method: 'POST' }),
  
  disableRepository: (id: string) => 
    fetchWithAuth<Repository>(`/repositories/${id}/disable`, { method: 'POST' }),
};

// Issue endpoints
export const issueApi = {
  listIssues: (repositoryId: string) => 
    fetchWithAuth<Issue[]>(`/repositories/${repositoryId}/issues`),
  
  getIssue: (repositoryId: string, issueId: string) => 
    fetchWithAuth<Issue>(`/repositories/${repositoryId}/issues/${issueId}`),
  
  setPayout: (repositoryId: string, issueId: string, amount: number, currency: string) => 
    fetchWithAuth<Issue>(`/repositories/${repositoryId}/issues/${issueId}/payout`, {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    }),
};

// Payout endpoints
export const payoutApi = {
  listPayouts: (repositoryId?: string) => 
    fetchWithAuth<Payout[]>(repositoryId ? 
      `/repositories/${repositoryId}/payouts` : '/payouts'),
  
  getPayout: (id: string) => fetchWithAuth<Payout>(`/payouts/${id}`),
  
  claimPayout: (token: string, email: string) => 
    fetchWithAuth<Payout>(`/payouts/claim/${token}`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// Mock API for development - simulating responses
// In a real app, remove all this mock code
export const mockApi = {
  // Add mock implementations here for development
  user: {
    id: '1',
    name: 'Jane Developer',
    email: 'jane@example.com',
    avatarUrl: 'https://github.com/github.png',
    githubId: '123456',
    coinbaseConnected: true
  },
  repositories: [
    {
      id: '1',
      name: 'awesome-project',
      owner: 'saucyorg',
      description: 'A truly awesome project with many contributors',
      enabled: true,
      totalPaid: 1200,
      pendingPayouts: 300,
    },
    {
      id: '2',
      name: 'documentation',
      owner: 'saucyorg',
      description: 'Project documentation and guides',
      enabled: true,
      totalPaid: 400,
      pendingPayouts: 0,
    },
    {
      id: '3',
      name: 'marketing-site',
      owner: 'saucyorg',
      description: 'Our marketing website',
      enabled: false,
      totalPaid: 0,
      pendingPayouts: 0,
    }
  ],
  issues: [
    {
      id: '101',
      title: 'Fix authentication bug',
      number: 42,
      repositoryId: '1',
      repositoryName: 'awesome-project',
      amount: 100,
      currency: 'USD',
      status: 'open'
    },
    {
      id: '102',
      title: 'Improve UI responsiveness',
      number: 43,
      repositoryId: '1',
      repositoryName: 'awesome-project',
      amount: 75,
      currency: 'USD',
      status: 'assigned'
    },
    {
      id: '103',
      title: 'Add dark mode support',
      number: 44,
      repositoryId: '1',
      repositoryName: 'awesome-project',
      amount: 150,
      currency: 'USD',
      status: 'completed'
    }
  ],
  payouts: [
    {
      id: 'payout1',
      repositoryId: '1',
      repositoryName: 'awesome-project',
      pullRequestId: 'pr101',
      pullRequestNumber: 101,
      contributorId: 'contributor1',
      contributorName: 'Alice Developer',
      amount: 100,
      currency: 'USD',
      status: 'paid',
      createdAt: '2025-05-10T12:00:00Z',
      updatedAt: '2025-05-10T12:30:00Z'
    },
    {
      id: 'payout2',
      repositoryId: '1',
      repositoryName: 'awesome-project',
      pullRequestId: 'pr102',
      pullRequestNumber: 102,
      contributorId: 'contributor2',
      contributorName: 'Bob Coder',
      amount: 150,
      currency: 'USD',
      status: 'pending',
      createdAt: '2025-05-14T09:00:00Z',
      updatedAt: '2025-05-14T09:00:00Z'
    }
  ]
};
