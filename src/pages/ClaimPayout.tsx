import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PayoutClaim from '@/components/PayoutClaim';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

const ClaimPayout = () => {
  const { payoutId } = useParams<{ payoutId: string }>();

  const { data: payout, isLoading, error, refetch } = useQuery({
    queryKey: ['payout', payoutId],
    queryFn: async () => {
      if (!payoutId) throw new Error('No payout ID provided');
      
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!payoutId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Payout Not Found</CardTitle>
            </div>
            <CardDescription>
              The payout you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleClaimed = () => {
    refetch();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Claim Your Bounty</h1>
          <p className="text-muted-foreground">
            You've earned a reward for your contribution!
          </p>
        </div>
        
        <PayoutClaim payout={payout} onClaimed={handleClaimed} />
      </div>
    </div>
  );
};

export default ClaimPayout;