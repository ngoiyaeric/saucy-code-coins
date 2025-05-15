
import { User, Repository, Issue, PullRequest, Payout } from "@/types";

// Mock user data
const user: User = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  avatarUrl: "https://avatars.githubusercontent.com/u/1234567",
  githubId: "johndoe",
  coinbaseConnected: true,
};

// Mock repository data
const repositories: Repository[] = [
  {
    id: "repo-1",
    name: "saucy",
    owner: "johndoe",
    description: "Automated payouts for GitHub contributors",
    enabled: true,
    totalPaid: 1250.00,
    pendingPayouts: 450.00,
  },
  {
    id: "repo-2",
    name: "project-x",
    owner: "johndoe",
    description: "A revolutionary blockchain project",
    enabled: true,
    totalPaid: 780.50,
    pendingPayouts: 120.00,
  },
  {
    id: "repo-3",
    name: "web3-tools",
    owner: "johndoe",
    description: "Utilities for Web3 developers",
    enabled: false,
    totalPaid: 350.25,
    pendingPayouts: 0,
  }
];

// Mock issue data
const issues: Issue[] = [
  {
    id: "issue-1",
    title: "Implement authentication flow",
    number: 42,
    repositoryId: "repo-1",
    repositoryName: "saucy",
    amount: 100.00,
    currency: "USD",
    status: "open",
  },
  {
    id: "issue-2",
    title: "Fix responsive design on dashboard",
    number: 43,
    repositoryId: "repo-1",
    repositoryName: "saucy",
    amount: 50.00,
    currency: "USD",
    status: "assigned",
  },
  {
    id: "issue-3",
    title: "Add support for Ethereum payments",
    number: 44,
    repositoryId: "repo-1",
    repositoryName: "saucy",
    amount: 300.00,
    currency: "USD",
    status: "completed",
  }
];

// Mock pull request data
const pullRequests: PullRequest[] = [
  {
    id: "pr-1",
    title: "Add authentication flow implementation",
    number: 45,
    repositoryId: "repo-1",
    repositoryName: "saucy",
    contributorId: "user-2",
    contributorName: "Alice Smith",
    issueLinkIds: ["issue-1"],
    status: "merged",
  },
  {
    id: "pr-2",
    title: "Fix dashboard responsive design issues",
    number: 46,
    repositoryId: "repo-1",
    repositoryName: "saucy",
    contributorId: "user-3",
    contributorName: "Bob Johnson",
    issueLinkIds: ["issue-2"],
    status: "open",
  }
];

// Mock payout data - Ensure status values match the Payout interface
const payouts: Payout[] = [
  {
    id: "payout-1",
    repositoryId: "repo-1",
    repositoryName: "saucy",
    pullRequestId: "pr-1",
    pullRequestNumber: 45,
    contributorId: "user-2",
    contributorName: "Alice Smith",
    amount: 100.00,
    currency: "USD",
    status: "paid", // Using one of the allowed status values
    createdAt: "2023-05-01T12:00:00Z",
    updatedAt: "2023-05-01T14:30:00Z",
  },
  {
    id: "payout-2",
    repositoryId: "repo-1",
    repositoryName: "saucy",
    pullRequestId: "pr-2",
    pullRequestNumber: 46,
    contributorId: "user-3",
    contributorName: "Bob Johnson",
    amount: 50.00,
    currency: "USD",
    status: "pending", // Using one of the allowed status values
    createdAt: "2023-05-10T10:15:00Z",
    updatedAt: "2023-05-10T10:15:00Z",
  },
  {
    id: "payout-3",
    repositoryId: "repo-2",
    repositoryName: "project-x",
    pullRequestId: "pr-3",
    pullRequestNumber: 12,
    contributorId: "user-4",
    contributorName: "Charlie Davis",
    amount: 200.00,
    currency: "USD",
    status: "claimed", // Using one of the allowed status values
    createdAt: "2023-04-15T09:20:00Z",
    updatedAt: "2023-04-15T17:45:00Z",
  },
  {
    id: "payout-4",
    repositoryId: "repo-2",
    repositoryName: "project-x",
    pullRequestId: "pr-4",
    pullRequestNumber: 15,
    contributorId: "user-5",
    contributorName: "Diana Evans",
    amount: 75.00,
    currency: "USD",
    status: "failed", // Using one of the allowed status values
    createdAt: "2023-04-20T14:30:00Z",
    updatedAt: "2023-04-21T10:10:00Z",
  }
];

// Mock API client
export const mockApi = {
  user,
  repositories,
  issues,
  pullRequests,
  payouts,
};
