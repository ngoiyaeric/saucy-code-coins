
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          scopes: 'read:user user:email repo'
        }
      });

      if (error) {
        console.error('GitHub sign in error:', error);
        toast.error('Failed to sign in with GitHub');
      }
    } catch (error) {
      console.error('GitHub sign in error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saucy-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saucy-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-saucy-500 rounded-full p-3">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Saucy</CardTitle>
          <CardDescription>
            Sign in with GitHub to start earning crypto for your contributions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            <Github className="mr-2 h-5 w-5" />
            {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
          </Button>
          
          <div className="text-sm text-muted-foreground text-center">
            <p>By signing in, you agree to our terms of service and privacy policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
