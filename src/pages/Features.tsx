
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Zap, 
  Shield, 
  Clock, 
  Github, 
  Users,
  ArrowRight,
  CheckCircle 
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Automated Bounty Payments",
      description: "Set bounties on GitHub issues and automatically pay contributors when their pull requests are merged.",
      badge: "Core Feature"
    },
    {
      icon: <Github className="h-8 w-8" />,
      title: "GitHub Integration",
      description: "Seamlessly connects with your GitHub repositories and tracks pull request activity.",
      badge: "Integration"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Crypto Payments",
      description: "Pay contributors in USDC directly to their wallets through Coinbase integration.",
      badge: "Payment"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Authentication",
      description: "OAuth-based authentication ensures secure access to your repositories and payment methods.",
      badge: "Security"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Real-time Tracking",
      description: "Monitor bounty status, contributor activity, and payment history in real-time.",
      badge: "Analytics"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Contributor Management",
      description: "Manage contributor relationships and track their contributions across projects.",
      badge: "Management"
    }
  ];

  const benefits = [
    "No more manual payment processing",
    "Increase contributor motivation",
    "Transparent bounty system",
    "Automated workflow integration",
    "Global contributor access",
    "Crypto payment flexibility"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container-wide pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="heading-1 mb-6">
            <span className="gradient-text">Powerful Features</span> for Open Source Success
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Everything you need to incentivize and reward open source contributors with automated crypto payments.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="relative group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-saucy-500/10 rounded-lg p-3 text-saucy-500">
                    {feature.icon}
                  </div>
                  <Badge variant="secondary">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-saucy-50 to-blue-50 rounded-2xl p-8 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Why Choose Saucy?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground/80">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of projects already using Saucy to reward their contributors.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth">
                <Github className="mr-2 h-5 w-5" />
                Get Started for Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Features;
