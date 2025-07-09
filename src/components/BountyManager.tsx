import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GitHubIssue, BountyAssignment, GitHubRepository } from '@/services/githubService';
import { DollarSign, ExternalLink, MessageSquare, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BountyManagerProps {
  repository: GitHubRepository;
  issues: GitHubIssue[];
  bountyAssignments: BountyAssignment[];
  onBountyCreate?: (issueId: number, amount: number) => void;
}

const BountyManager: React.FC<BountyManagerProps> = ({
  repository,
  issues,
  bountyAssignments,
  onBountyCreate
}) => {
  const [customAmounts, setCustomAmounts] = useState<Record<number, number>>({});
  const [loadingBounties, setLoadingBounties] = useState<Set<number>>(new Set());

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'critical': return <AlertCircle className="h-3 w-3" />;
      case 'high': return <TrendingUp className="h-3 w-3" />;
      default: return <DollarSign className="h-3 w-3" />;
    }
  };

  const handleCreateBounty = async (issue: GitHubIssue, bountyAssignment: BountyAssignment) => {
    const amount = customAmounts[issue.id] || bountyAssignment.suggestedAmount;
    
    setLoadingBounties(prev => new Set(prev).add(issue.id));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to create bounties');
        return;
      }

      // Create bounty record in database  
      const { error } = await supabase
        .from('bounties' as any)
        .insert({
          repository_id: repository.id.toString(),
          repository_name: repository.full_name,
          issue_id: issue.id.toString(),
          issue_number: issue.number,
          issue_title: issue.title,
          amount: amount,
          currency: 'USD',
          complexity: bountyAssignment.complexity,
          status: 'active',
          creator_id: user.id
        });

      if (error) {
        console.error('Error creating bounty:', error);
        toast.error('Failed to create bounty');
        return;
      }

      toast.success(`Bounty of $${amount} created for issue #${issue.number}`);
      onBountyCreate?.(issue.id, amount);
      
    } catch (error) {
      console.error('Error creating bounty:', error);
      toast.error('Failed to create bounty');
    } finally {
      setLoadingBounties(prev => {
        const newSet = new Set(prev);
        newSet.delete(issue.id);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{repository.name}</h3>
          <p className="text-sm text-muted-foreground">{repository.description}</p>
        </div>
        <a 
          href={repository.html_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-sm text-primary hover:underline"
        >
          View on GitHub <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-4">
        {issues.map((issue) => {
          const bountyAssignment = bountyAssignments.find(b => b.issueId === issue.id);
          if (!bountyAssignment) return null;

          return (
            <Card key={issue.id} className="card-3d">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight">
                      #{issue.number}: {issue.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(issue.created_at)}</span>
                      <MessageSquare className="h-3 w-3 ml-2" />
                      <span>{issue.comments} comments</span>
                    </div>
                  </div>
                  <a 
                    href={issue.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center"
                  >
                    View <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Labels */}
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map((label) => (
                    <Badge 
                      key={label.id} 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `#${label.color}20`,
                        borderColor: `#${label.color}`,
                        color: `#${label.color}`
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>

                {/* Bounty Assignment Info */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`text-xs ${getComplexityColor(bountyAssignment.complexity)}`}
                      >
                        {getComplexityIcon(bountyAssignment.complexity)}
                        <span className="ml-1 capitalize">{bountyAssignment.complexity}</span>
                      </Badge>
                      <span className="text-sm">
                        Confidence: {Math.round(bountyAssignment.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        ${bountyAssignment.suggestedAmount}
                      </div>
                      <div className="text-xs text-muted-foreground">Suggested</div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {bountyAssignment.reasoning}
                  </p>
                </div>

                {/* Bounty Creation */}
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder={bountyAssignment.suggestedAmount.toString()}
                    value={customAmounts[issue.id] || ''}
                    onChange={(e) => setCustomAmounts(prev => ({
                      ...prev,
                      [issue.id]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-24"
                    min="1"
                  />
                  <span className="text-sm text-muted-foreground">USD</span>
                  <Button
                    onClick={() => handleCreateBounty(issue, bountyAssignment)}
                    disabled={loadingBounties.has(issue.id)}
                    size="sm"
                    className="ml-auto"
                  >
                    {loadingBounties.has(issue.id) ? 'Creating...' : 'Create Bounty'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {issues.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No open issues found in this repository.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BountyManager;