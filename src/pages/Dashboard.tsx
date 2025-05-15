
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockApi } from "@/lib/api";
import { Repository, Payout } from "@/types";
import Navbar from "@/components/Navbar";
import { CreditCard, Github, BarChart2 } from "lucide-react";

const Dashboard = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data loading - in a real app, this would use the actual API client
  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setRepositories(mockApi.repositories);
      setPayouts(mockApi.payouts);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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
        <div className="grid gap-4 md:grid-cols-3 mb-8">
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
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Repositories</h2>
              <Button>
                <Github className="mr-2 h-4 w-4" />
                Connect Repository
              </Button>
            </div>

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
                              : "bg-blue-100 text-blue-800"
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
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and connected services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium">GitHub Connection</h3>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <Github className="h-5 w-5 mr-2" />
                      <span>Connected as {mockApi.user.name}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Reconnect
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Coinbase Connection</h3>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span>
                        {mockApi.user.coinbaseConnected
                          ? `Connected to ${mockApi.user.email}`
                          : "Not connected"}
                      </span>
                    </div>
                    <Button variant={mockApi.user.coinbaseConnected ? "outline" : "default"} size="sm">
                      {mockApi.user.coinbaseConnected ? "Reconnect" : "Connect"}
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
