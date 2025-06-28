
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Book, 
  Github, 
  Zap, 
  Settings, 
  CreditCard,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

const Documentation = () => {
  const sections = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Quick Start",
      description: "Get up and running with Saucy in minutes",
      items: [
        "Sign in with GitHub",
        "Connect your Coinbase wallet",
        "Set up your first bounty",
        "Start rewarding contributors"
      ]
    },
    {
      icon: <Github className="h-6 w-6" />,
      title: "GitHub Integration",
      description: "Learn how to integrate Saucy with your repositories",
      items: [
        "Repository permissions",
        "Webhook configuration",
        "Issue labeling system",
        "Pull request tracking"
      ]
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Payment Setup",
      description: "Configure crypto payments through Coinbase",
      items: [
        "Coinbase wallet connection",
        "USDC payment configuration",
        "Automatic payout triggers",
        "Payment history tracking"
      ]
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Configuration",
      description: "Customize Saucy for your project needs",
      items: [
        "Bounty amount settings",
        "Contributor eligibility rules",
        "Notification preferences",
        "Team management"
      ]
    }
  ];

  const quickStartSteps = [
    {
      step: "01",
      title: "Connect GitHub",
      description: "Sign in with your GitHub account to access your repositories and manage bounties."
    },
    {
      step: "02", 
      title: "Setup Payments",
      description: "Connect your Coinbase account to enable automatic crypto payments to contributors."
    },
    {
      step: "03",
      title: "Create Bounties",
      description: "Set bounty amounts on GitHub issues to incentivize contributions."
    },
    {
      step: "04",
      title: "Auto-Pay Contributors",
      description: "When pull requests are merged, contributors automatically receive their rewards."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container-wide pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="heading-1 mb-6">
            <span className="gradient-text">Documentation</span>
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Everything you need to know to get started with Saucy and reward your open source contributors.
          </p>
        </div>

        {/* Quick Start Guide */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Quick Start Guide</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStartSteps.map((step, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="bg-saucy-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-4">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {sections.map((section, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-saucy-500/10 rounded-lg p-2 text-saucy-500">
                    {section.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center space-x-2 text-sm text-foreground/80">
                      <ArrowRight className="h-3 w-3 text-saucy-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help & Support */}
        <div className="bg-gradient-to-br from-saucy-50 to-blue-50 rounded-2xl p-8 text-center">
          <Book className="h-12 w-12 text-saucy-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-foreground/80 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Check our comprehensive guides or reach out to our support team.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link to="/auth">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub Support
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Documentation;
