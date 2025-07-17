
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CoinbaseConnection = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  useEffect(() => {
    checkCoinbaseConnection();
    
    // Check for connection success from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('coinbase') === 'connected') {
      toast.success('Coinbase connected successfully!');
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (urlParams.get('error')) {
      toast.error(`Connection failed: ${urlParams.get('error')}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const checkCoinbaseConnection = async () => {
    if (!user) return;

    try {
      // Check both Coinbase auth and GitHub auth to ensure proper linking
      const [coinbaseAuthResult, githubAuthResult] = await Promise.all([
        supabase.from('coinbase_auth').select('*').eq('user_id', user.id).single(),
        supabase.from('github_auth').select('*').eq('user_id', user.id).single()
      ]);

      const hasCoinbaseAuth = !!coinbaseAuthResult.data && !coinbaseAuthResult.error;
      const hasGitHubAuth = !!githubAuthResult.data && !githubAuthResult.error;

      if (hasCoinbaseAuth && hasGitHubAuth) {
        setIsConnected(true);
      } else if (hasCoinbaseAuth && !hasGitHubAuth) {
        // User has Coinbase but not GitHub - this shouldn't happen in normal flow
        console.warn('User has Coinbase auth but missing GitHub auth');
        setIsConnected(false);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking Coinbase connection:', error);
      setIsConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleCoinbaseConnect = async () => {
    if (!user) {
      toast.error('Please sign in with GitHub first');
      return;
    }

    setIsLoading(true);
    try {
      // Get GitHub user info to connect with Coinbase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        toast.error('GitHub connection required for Coinbase integration');
        setIsLoading(false);
        return;
      }

      // Using real Coinbase OAuth flow
      const clientId = 'your-coinbase-client-id'; // This should be set via secrets
      const redirectUri = `${window.location.origin}/functions/v1/coinbase-oauth`;
      const state = JSON.stringify({
        userId: user.id,
        githubToken: session.provider_token,
        timestamp: Date.now()
      });
      
      const authUrl = `https://www.coinbase.com/oauth/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${encodeURIComponent(state)}&` +
        `scope=wallet:accounts:read,wallet:transactions:send,wallet:deposits:create`;

      // For development: simulate connection if using generic client ID
      if (clientId === 'your-coinbase-client-id') {
        toast.info('Development mode: Simulating Coinbase connection');
        
        // Create a mock Coinbase auth record
        const { error } = await supabase
          .from('coinbase_auth')
          .upsert({
            user_id: user.id,
            access_token: 'dev-mock-access-token',
            refresh_token: 'dev-mock-refresh-token',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          });

        if (error) {
          console.error('Error creating mock Coinbase auth:', error);
          toast.error('Failed to simulate Coinbase connection');
        } else {
          setTimeout(() => {
            setIsConnected(true);
            setIsLoading(false);
            toast.success('Coinbase connected (development mode)');
          }, 2000);
        }
        return;
      }

      // Redirect to actual Coinbase OAuth
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error connecting to Coinbase:', error);
      toast.error('Failed to connect to Coinbase');
      setIsLoading(false);
    }
  };

  if (checkingConnection) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saucy-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <CardTitle>Coinbase Wallet</CardTitle>
          </div>
          {isConnected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected (Dev Mode)
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your Coinbase account to receive crypto payments for your contributions.
          {!isConnected && (
            <span className="block mt-2 text-amber-600">
              Currently using development mode with generic keys.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <Button 
            onClick={handleCoinbaseConnect}
            disabled={isLoading}
            className="w-full"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isLoading ? 'Connecting...' : 'Connect Coinbase (Dev Mode)'}
          </Button>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Your Coinbase account is connected and ready to receive payments.
            <div className="mt-2 text-amber-600">
              Development mode - replace with real credentials for production.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoinbaseConnection;
