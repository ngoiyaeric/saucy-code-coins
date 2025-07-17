
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
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('*').order('price_monthly');
      if (error) throw error;
      return data?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      })) as Plan[];
    },
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
              Start with a free trial, then pay only when your contributors get paid
            </p>
            
            <div className="mt-10 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">2.5%</div>
                <div className="text-lg font-medium mb-1">Transaction Fee</div>
                <div className="text-sm text-muted-foreground">Only charged when contributors receive payouts</div>
              </div>
            </div>
          </div>
          
           {isLoading ? (
             <div className="flex justify-center">
               <Card className="w-full max-w-md h-[400px] opacity-50 animate-pulse">
                 <div className="h-full bg-muted"></div>
               </Card>
             </div>
           ) : plans ? (
             <div className="flex justify-center">
               {plans.map((plan: Plan) => (
                 <Card 
                   key={plan.id} 
                   className={`w-full max-w-md ${plan.is_popular ? 'border-primary shadow-lg relative' : ''}`}
                 >
                   {plan.is_popular && (
                     <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                       <Badge className="px-3 py-1">Recommended</Badge>
                     </div>
                   )}
                   <CardHeader className="text-center">
                     <CardTitle className="text-2xl">{plan.name}</CardTitle>
                     <CardDescription className="text-base">{plan.description}</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-6">
                     <div className="text-center">
                       <span className="text-5xl font-bold text-primary">Free</span>
                       <div className="text-sm text-muted-foreground mt-2">7-day trial included</div>
                     </div>
                     
                     <div className="space-y-3">
                       {plan.features.map((feature, index) => (
                         <div key={index} className="flex items-start">
                           <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                           <span className="text-sm">{feature}</span>
                         </div>
                       ))}
                     </div>
                   </CardContent>
                   <CardFooter>
                     <Button 
                       onClick={() => handleSelectPlan(plan)}
                       className="w-full"
                       size="lg"
                     >
                       Start Free Trial
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
