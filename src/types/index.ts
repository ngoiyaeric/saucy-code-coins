
// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  githubId?: string;
  coinbaseConnected: boolean;
}

// Repository interfaces
export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  enabled: boolean;
  totalPaid: number;
  pendingPayouts: number;
}

// Issue interfaces
export interface Issue {
  id: string;
  title: string;
  number: number;
  repositoryId: string;
  repositoryName: string;
  amount: number;
  currency: string;
  status: 'open' | 'assigned' | 'completed' | 'paid';
}

// PR interfaces
export interface PullRequest {
  id: string;
  title: string;
  number: number;
  repositoryId: string;
  repositoryName: string;
  contributorId: string;
  contributorName: string;
  issueLinkIds: string[];
  status: 'open' | 'merged' | 'closed';
}

// Payout interfaces
export interface Payout {
  id: string;
  repositoryId: string;
  repositoryName: string;
  pullRequestId: string;
  pullRequestNumber: number;
  contributorId: string;
  contributorName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'claimed' | 'paid' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
