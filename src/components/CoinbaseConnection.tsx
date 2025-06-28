
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
      const { data, error } = await supabase
        .from('coinbase_auth')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setIsConnected(!!data && !error);
    } catch (error) {
      console.error('Error checking Coinbase connection:', error);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleCoinbaseConnect = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Using generic client ID for now - will be replaced with actual Coinbase credentials
      const clientId = 'generic-coinbase-client-id';
      const redirectUri = `${window.location.origin}/functions/v1/coinbase-oauth`;
      const state = user.id; // Pass user ID as state
      
      const authUrl = `https://www.coinbase.com/oauth/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=wallet:accounts:read,wallet:transactions:send`;

      // For now, simulate connection since we're using generic keys
      toast.info('Using generic Coinbase connection for development');
      
      // Simulate successful connection after a short delay
      setTimeout(() => {
        setIsConnected(true);
        setIsLoading(false);
        toast.success('Coinbase connected (development mode)');
      }, 2000);

      // Uncomment this line when you have real Coinbase credentials:
      // window.location.href = authUrl;
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
