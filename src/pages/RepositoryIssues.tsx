import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Github, RefreshCw } from "lucide-react";
import { GitHubService, GitHubRepository, GitHubIssue, BountyAssignment } from "@/services/githubService";
import BountyManager from "@/components/BountyManager";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const RepositoryIssues = () => {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const [repository, setRepository] = useState<GitHubRepository | null>(null);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [bountyAssignments, setBountyAssignments] = useState<BountyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (repositoryId) {
      fetchRepositoryData();
    }
  }, [repositoryId]);

  const fetchRepositoryData = async () => {
    if (!repositoryId) return;

    setLoading(true);
    try {
      // Get repository details from enabled_repositories table
      const { data: repoData, error: repoError } = await supabase
        .from('enabled_repositories')
        .select('*')
        .eq('repository_id', repositoryId)
        .single();

      if (repoError) {
        console.error('Error fetching repository:', repoError);
        toast.error('Repository not found');
        return;
      }

      // Convert to GitHubRepository format
      const repo: GitHubRepository = {
        id: parseInt(repoData.repository_id),
        name: repoData.repository_name,
        full_name: repoData.repository_full_name,
        description: repoData.repository_description || '',
        private: false,
        owner: {
          login: repoData.repository_full_name.split('/')[0],
          id: 0,
          avatar_url: '',
          type: 'User'
        },
        html_url: `https://github.com/${repoData.repository_full_name}`,
        clone_url: `https://github.com/${repoData.repository_full_name}.git`,
        ssh_url: `git@github.com:${repoData.repository_full_name}.git`,
        language: repoData.repository_language || '',
        stargazers_count: repoData.stargazers_count || 0,
        watchers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        default_branch: 'main',
        permissions: {
          admin: true,
          maintain: true,
          push: true,
          triage: true,
          pull: true
        }
      };

      setRepository(repo);

      // Fetch issues from GitHub
      const issuesData = await GitHubService.getRepositoryIssues(repo.full_name);
      setIssues(issuesData);

      toast.success('Repository data loaded successfully');
    } catch (error) {
      console.error('Error fetching repository data:', error);
      toast.error('Failed to load repository data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeIssues = async () => {
    if (!repository || issues.length === 0) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-issue-complexity', {
        body: {
          repository: repository.full_name,
          issues: issues.map(issue => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body || '',
            labels: issue.labels.map(l => l.name),
            comments: issue.comments,
            created_at: issue.created_at
          }))
        }
      });

      if (error) {
        console.error('Error analyzing issues:', error);
        toast.error('Failed to analyze issues');
        return;
      }

      setBountyAssignments(data.assignments || []);
      toast.success(`Analyzed ${data.assignments?.length || 0} issues for bounty potential`);
    } catch (error) {
      console.error('Error analyzing issues:', error);
      toast.error('Failed to analyze issues');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBountyCreate = (issueId: number, amount: number) => {
    toast.success(`Bounty created successfully for $${amount}`);
    // Optionally refresh data or update UI
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container-wide py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container-wide py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Repository not found</h2>
              <p className="text-muted-foreground mb-4">
                The repository you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container-wide py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="heading-2">{repository.full_name}</h1>
              <p className="text-muted-foreground">Manage bounties for repository issues</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={fetchRepositoryData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Issues
            </Button>
            <Button 
              onClick={analyzeIssues} 
              disabled={analyzing || issues.length === 0}
              size="sm"
            >
              <Github className="h-4 w-4 mr-2" />
              {analyzing ? 'Analyzing...' : 'Analyze Issues'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{issues.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Analyzed Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bountyAssignments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Bounty Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${bountyAssignments.reduce((total, assignment) => total + assignment.suggestedAmount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues and Bounties */}
        {issues.length > 0 ? (
          bountyAssignments.length > 0 ? (
            <BountyManager
              repository={repository}
              issues={issues}
              bountyAssignments={bountyAssignments}
              onBountyCreate={handleBountyCreate}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Github className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Issues loaded</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Analyze Issues" to use AI to assess complexity and suggest bounty amounts.
                </p>
                <Button onClick={analyzeIssues} disabled={analyzing}>
                  <Github className="h-4 w-4 mr-2" />
                  {analyzing ? 'Analyzing...' : 'Analyze Issues'}
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Github className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">No open issues</h3>
              <p className="text-muted-foreground">
                This repository doesn't have any open issues at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default RepositoryIssues;