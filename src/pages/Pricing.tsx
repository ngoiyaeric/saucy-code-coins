
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlans } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular: boolean;
}

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();
  
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  });
  
  if (error) {
    toast({
      title: "Error loading plans",
      description: "Please try again later.",
      variant: "destructive",
    });
  }

  const handleSelectPlan = async (plan: Plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan",
      });
      navigate("/auth/login", { state: { returnTo: "/pricing" } });
      return;
    }
    
    // In a real application, this would redirect to a checkout page
    // or initiate a payment flow. For now, we'll just show a toast.
    toast({
      title: `Selected ${plan.name} plan`,
      description: `You selected the ${plan.name} plan with ${billingCycle} billing.`,
    });
    
    // For free plan, we would directly create a subscription
    if (plan.price_monthly === 0) {
      // Create subscription logic would go here
      toast({
        title: "Free plan activated",
        description: "You have successfully subscribed to the free plan.",
      });
    } else {
      // For paid plans, we would redirect to checkout
      // navigate("/checkout", { state: { planId: plan.id, billingCycle } });
      toast({
        title: "Checkout coming soon",
        description: "In a real application, you would be redirected to checkout.",
      });
    }
  };
  
  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your project's needs
            </p>
            
            <div className="mt-10 flex items-center justify-center">
              <Label htmlFor="billing-toggle" className="mr-4 text-sm font-medium">
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={billingCycle === 'yearly'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
              />
              <Label htmlFor="billing-toggle" className="ml-4 text-sm font-medium flex items-center">
                Yearly
                <Badge className="ml-2" variant="outline">Save 20%</Badge>
              </Label>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8 place-items-center">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="w-full h-[400px] opacity-50 animate-pulse">
                  <div className="h-full bg-muted"></div>
                </Card>
              ))}
            </div>
          ) : plans ? (
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan: Plan) => (
                <Card 
                  key={plan.id} 
                  className={`w-full ${plan.is_popular ? 'border-primary shadow-lg' : ''}`}
                >
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
                      <Badge className="px-3 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-4xl font-bold">
                        {formatPrice(billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly)}
                      </span>
                      {plan.price_monthly > 0 && (
                        <span className="text-muted-foreground">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 pt-4">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-primary mr-2" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleSelectPlan(plan)}
                      className="w-full"
                      variant={plan.is_popular ? "default" : "outline"}
                    >
                      {plan.price_monthly === 0 ? "Get Started" : "Subscribe"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Failed to load pricing plans
            </div>
          )}
          
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold">Need a custom plan?</h2>
            <p className="mt-2 text-muted-foreground">
              Contact us for custom pricing and features tailored to your specific needs.
            </p>
            <Button variant="outline" className="mt-4">
              Contact Sales
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
