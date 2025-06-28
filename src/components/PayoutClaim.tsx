
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Payout {
  id: string;
  repository_name: string;
  pull_request_number: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface PayoutClaimProps {
  payout: Payout;
  onClaimed: () => void;
}

const PayoutClaim: React.FC<PayoutClaimProps> = ({ payout, onClaimed }) => {
  const { user } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async () => {
    if (!user || !walletAddress.trim()) {
      toast.error('Please enter a valid wallet address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('send-crypto', {
        body: {
          payoutId: payout.id,
          userId: user.id,
          walletAddress: walletAddress.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('Payment sent successfully!');
      onClaimed();
    } catch (error) {
      console.error('Error claiming payout:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send payment');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'claimed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle className="text-lg">
              ${payout.amount} {payout.currency}
            </CardTitle>
          </div>
          <Badge className={getStatusColor(payout.status)}>
            {payout.status}
          </Badge>
        </div>
        <CardDescription>
          Bounty for PR #{payout.pull_request_number} in {payout.repository_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {payout.status === 'pending' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="wallet-address">USDC Wallet Address</Label>
              <Input
                id="wallet-address"
                placeholder="Enter your USDC wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleClaim}
              disabled={isLoading || !walletAddress.trim()}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? 'Sending...' : 'Claim Payment'}
            </Button>
          </>
        )}
        
        {payout.status === 'paid' && (
          <div className="text-center text-sm text-green-600">
            Payment has been sent to your wallet successfully!
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Created: {new Date(payout.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutClaim;
