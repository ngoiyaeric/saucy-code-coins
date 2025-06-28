
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for auth errors in URL params
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      console.error('Auth error from URL:', errorParam, errorDescription);
      setError(errorDescription || errorParam);
      toast.error(`Authentication failed: ${errorDescription || errorParam}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !loading) {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current origin and construct redirect URL
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/dashboard`;
      
      console.log('Attempting GitHub sign in with redirect:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          scopes: 'read:user user:email repo',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      console.log('GitHub OAuth response:', { data, error });

      if (error) {
        console.error('GitHub sign in error:', error);
        setError(error.message);
        toast.error(`Failed to sign in with GitHub: ${error.message}`);
        return;
      }

      // The redirect will happen automatically if successful
      console.log('GitHub OAuth initiated successfully');
      
    } catch (error: any) {
      console.error('Unexpected GitHub sign in error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(`An unexpected error occurred: ${errorMessage}`);
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Authentication Error</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}
          
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
            <p className="mt-2 text-xs">
              Having trouble? Make sure pop-ups are enabled for this site.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
