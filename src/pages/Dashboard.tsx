import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Repository, Payout } from "@/types";
import Navbar from "@/components/Navbar";
import { CreditCard, Github, BarChart2, Building2, Users } from "lucide-react";
import { GitHubService, GitHubOrganization, GitHubRepository } from "@/services/githubService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CoinbaseConnection from "@/components/CoinbaseConnection";

const Dashboard = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [githubData, setGithubData] = useState<{
    userRepos: GitHubRepository[];
    orgRepos: Record<string, GitHubRepository[]>;
    organizations: GitHubOrganization[];
  } | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [enabledRepos, setEnabledRepos] = useState<Record<string, boolean>>({});
  const [toggleLoading, setToggleLoading] = useState<Set<string>>(new Set());
  const [processingIssues, setProcessingIssues] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load real payouts from database and transform to match Payout interface
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (payoutsError) {
        console.error('Error loading payouts:', payoutsError);
      } else {
        const transformedPayouts = (payoutsData || []).map(payout => ({
          id: payout.id,
          repositoryId: payout.repository_id,
          repositoryName: payout.repository_name,
          pullRequestId: payout.pull_request_id,
          pullRequestNumber: payout.pull_request_number,
          contributorId: payout.contributor_id,
          contributorName: payout.contributor_name,
          amount: Number(payout.amount),
          currency: payout.currency,
          status: payout.status as "pending" | "claimed" | "paid" | "failed",
          createdAt: payout.created_at,
          updatedAt: payout.updated_at
        }));
        setPayouts(transformedPayouts);
      }

      // Load enabled repositories and transform to match Repository interface
      const { data: reposData, error: reposError } = await supabase
        .from('enabled_repositories')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (reposError) {
        console.error('Error loading repositories:', reposError);
      } else {
        const transformedRepos = (reposData || []).map(repo => ({
          id: repo.repository_id,
          name: repo.repository_name,
          owner: repo.repository_full_name.split('/')[0],
          description: repo.repository_description || '',
          enabled: repo.enabled,
          totalPaid: 0, // Will be calculated from actual payouts
          pendingPayouts: 0, // Will be calculated from pending payouts
          createdAt: repo.created_at,
          updatedAt: repo.updated_at
        }));
        setRepositories(transformedRepos);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGitHubData = async () => {
    setLoadingGithub(true);
    try {
      const data = await GitHubService.getAllAccessibleRepositories();
      setGithubData(data);
      
      // Fetch enabled repositories from Supabase
      const { data: enabledData, error } = await supabase
        .from('enabled_repositories')
        .select('repository_id, enabled');
      
      if (!error && enabledData) {
        const enabledMap: Record<string, boolean> = {};
        enabledData.forEach(repo => {
          enabledMap[repo.repository_id] = repo.enabled;
        });
        setEnabledRepos(enabledMap);
      }
      
      toast.success('GitHub data loaded successfully');
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      toast.error('Failed to load GitHub data. Please check your permissions.');
    } finally {
      setLoadingGithub(false);
    }
  };

  const processRepositoryIssues = async () => {
    if (!githubData) {
      toast.error('Please load GitHub data first');
      return;
    }

    setProcessingIssues(true);
    try {
      // Get all enabled repositories
      const enabledRepoIds = Object.keys(enabledRepos).filter(id => enabledRepos[id]);
      const enabledRepositories = [...githubData.userRepos, ...Object.values(githubData.orgRepos).flat()]
        .filter(repo => enabledRepoIds.includes(repo.id.toString()));

      if (enabledRepositories.length === 0) {
        toast.error('No enabled repositories found');
        return;
      }

      console.log(`Processing ${enabledRepositories.length} enabled repositories for issue analysis`);
      
      // Process repositories with issues and bounty assignments
      const results = await GitHubService.getRepositoriesWithIssuesAndBounties(enabledRepositories);
      
      // Log results for debugging
      results.forEach(result => {
        console.log(`Repository ${result.repository.full_name}:`, {
          issues: result.issues.length,
          bounties: result.bountyAssignments.length,
          hasError: result.hasError,
          errorMessage: result.errorMessage
        });
      });

      const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
      const totalBounties = results.reduce((sum, r) => sum + r.bountyAssignments.length, 0);
      
      toast.success(`Processed ${totalIssues} issues and assigned ${totalBounties} bounty values across ${enabledRepositories.length} repositories`);
      
    } catch (error) {
      console.error('Error processing repository issues:', error);
      toast.error('Failed to process repository issues');
    } finally {
      setProcessingIssues(false);
    }
  };

  const toggleRepository = async (repo: GitHubRepository) => {
    const repoId = repo.id.toString();
    setToggleLoading(prev => new Set(prev).add(repoId));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to manage repositories');
        return;
      }

      const isCurrentlyEnabled = enabledRepos[repoId] || false;
      const newEnabledState = !isCurrentlyEnabled;

      if (newEnabledState) {
        // Add to enabled repositories
        const { error } = await supabase
          .from('enabled_repositories')
          .upsert({
            repository_id: repoId,
            user_id: user.id,
            repository_name: repo.name,
            repository_full_name: repo.full_name,
            repository_description: repo.description,
            repository_language: repo.language,
            stargazers_count: repo.stargazers_count,
            enabled: true
          });

        if (error) {
          console.error('Error enabling repository:', error);
          toast.error('Failed to enable repository');
          return;
        }
      } else {
        // Remove from enabled repositories
        const { error } = await supabase
          .from('enabled_repositories')
          .update({ enabled: false })
          .eq('repository_id', repoId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error disabling repository:', error);
          toast.error('Failed to disable repository');
          return;
        }
      }

      setEnabledRepos(prev => ({
        ...prev,
        [repoId]: newEnabledState
      }));

      toast.success(`Repository ${newEnabledState ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error toggling repository:', error);
      toast.error('Failed to update repository status');
    } finally {
      setToggleLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(repoId);
        return newSet;
      });
    }
  };

  // Helper to format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container-wide py-8">
        {/* Dashboard header */}
        <header className="mb-8">
          <h1 className="heading-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your repositories and payouts.
          </p>
        </header>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Connected Repositories
              </CardTitle>
              <Github className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : repositories.filter(r => r.enabled).length}
              </div>
              <p className="text-xs text-muted-foreground">
                of {isLoading ? "..." : repositories.length} total repositories
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {githubData ? githubData.organizations.length : "..."}
              </div>
              <p className="text-xs text-muted-foreground">
                GitHub organizations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Paid Out
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : formatCurrency(
                      repositories.reduce(
                        (total, repo) => total + repo.totalPaid,
                        0
                      )
                    )}
              </div>
              <p className="text-xs text-muted-foreground">
                across all repositories
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payouts
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : formatCurrency(
                      repositories.reduce(
                        (total, repo) => total + repo.pendingPayouts,
                        0
                      )
                    )}
              </div>
              <p className="text-xs text-muted-foreground">
                waiting to be claimed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content tabs */}
        <Tabs defaultValue="repositories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="repositories">Repositories</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Repositories</h2>
              <div className="flex gap-2">
                <Button onClick={fetchGitHubData} disabled={loadingGithub}>
                  <Github className="mr-2 h-4 w-4" />
                  {loadingGithub ? 'Loading...' : 'Refresh from GitHub'}
                </Button>
                <Button 
                  onClick={processRepositoryIssues} 
                  disabled={processingIssues || !githubData}
                  variant="outline"
                >
                  {processingIssues ? 'Processing...' : 'Process Issues'}
                </Button>
              </div>
            </div>

            {githubData && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Personal Repositories ({githubData.userRepos.length})</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {githubData.userRepos.slice(0, 12).map((repo) => {
                    const repoId = repo.id.toString();
                    const isEnabled = enabledRepos[repoId] || false;
                    const isToggling = toggleLoading.has(repoId);
                    
                    return (
                      <Card key={repo.id} className={`card-3d ${isEnabled ? 'ring-2 ring-primary/20' : ''}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-sm">{repo.name}</CardTitle>
                              <CardDescription className="text-xs">{repo.description || 'No description'}</CardDescription>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => toggleRepository(repo)}
                              disabled={isToggling}
                              className="ml-2"
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between text-xs mb-2">
                            <span>Language: {repo.language || 'N/A'}</span>
                            <span>⭐ {repo.stargazers_count}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded ${
                              isEnabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" size="sm" asChild>
                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                              View on GitHub
                            </a>
                          </Button>
                          {isEnabled && (
                            <Button size="sm" asChild>
                              <Link to={`/repositories/${repoId}/issues`}>
                                Manage Issues
                              </Link>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {isLoading ? (
              <p>Loading repositories...</p>
            ) : repositories.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {repositories.map((repo) => (
                  <Card key={repo.id} className={repo.enabled ? "" : "opacity-70"}>
                    <CardHeader>
                      <CardTitle>{repo.name}</CardTitle>
                      <CardDescription>{repo.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          repo.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {repo.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Paid:</span>
                        <span>{formatCurrency(repo.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pending:</span>
                        <span>{formatCurrency(repo.pendingPayouts)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" asChild>
                        <Link to={`/repositories/${repo.id}/issues`}>
                          View Issues
                        </Link>
                      </Button>
                      <Button 
                        variant={repo.enabled ? "destructive" : "default"}
                      >
                        {repo.enabled ? "Disable" : "Enable"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 flex flex-col items-center justify-center">
                  <Github className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No repositories connected</h3>
                  <p className="text-muted-foreground mb-4 text-center max-w-md">
                    Connect your GitHub repositories to start setting up automatic payouts for contributors.
                  </p>
                  <Button>
                    <Github className="mr-2 h-4 w-4" />
                    Connect Repository
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">GitHub Organizations</h2>
              <Button onClick={fetchGitHubData} disabled={loadingGithub}>
                <Building2 className="mr-2 h-4 w-4" />
                {loadingGithub ? 'Loading...' : 'Refresh Organizations'}
              </Button>
            </div>

            {githubData && githubData.organizations.length > 0 ? (
              <div className="space-y-6">
                {githubData.organizations.map((org) => (
                  <Card key={org.id}>
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <img 
                          src={org.avatar_url} 
                          alt={org.name || org.login}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <CardTitle>{org.name || org.login}</CardTitle>
                          <CardDescription>{org.description || 'No description available'}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Public Repos: {org.public_repos}</span>
                          {org.location && <span>Location: {org.location}</span>}
                        </div>
                      </div>
                      
                      {githubData.orgRepos[org.login] && githubData.orgRepos[org.login].length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Organization Repositories ({githubData.orgRepos[org.login].length})</h4>
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {githubData.orgRepos[org.login].slice(0, 6).map((repo) => (
                              <div key={repo.id} className="p-2 border rounded-md">
                                <div className="font-medium text-sm">{repo.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {repo.language || 'N/A'} • ⭐ {repo.stargazers_count}
                                </div>
                              </div>
                            ))}
                          </div>
                          {githubData.orgRepos[org.login].length > 6 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              and {githubData.orgRepos[org.login].length - 6} more repositories...
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 flex flex-col items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No organizations found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {githubData 
                      ? "You're not a member of any GitHub organizations, or they haven't been loaded yet."
                      : "Click 'Refresh Organizations' to load your GitHub organizations."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Payouts</h2>
            </div>

            {isLoading ? (
              <p>Loading payouts...</p>
            ) : payouts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Repository</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">PR #</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Contributor</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr
                        key={payout.id}
                        className="border-b border-border hover:bg-secondary/40"
                      >
                        <td className="p-3">{payout.repositoryName}</td>
                        <td className="p-3">#{payout.pullRequestNumber}</td>
                        <td className="p-3">{payout.contributorName}</td>
                        <td className="p-3">
                          {formatCurrency(payout.amount, payout.currency)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payout.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : payout.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : payout.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(payout.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 flex flex-col items-center justify-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No payouts yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Once contributors claim their payouts, they'll appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Coinbase Connection Section */}
            <CoinbaseConnection />
            
            <Card>
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium">GitHub Connection</h3>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <Github className="h-5 w-5 mr-2" />
                      <span>Connected via GitHub OAuth</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Reconnect
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Notification Settings</h3>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <span>Email notifications</span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
