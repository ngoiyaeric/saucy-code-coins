
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden tech-grid border-b border-border/20">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 perspective-container">
        {/* Floating geometric shapes - adjusted for white theme */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-lg floating-3d transform rotate-45 border border-primary/20" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-accent/10 rounded-full floating-3d border border-accent/20" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-primary/20 rounded-lg floating-3d transform rotate-12 border border-primary/30" style={{ animationDelay: '4s' }}></div>
        
        {/* Large gradient orbs - adjusted for white theme */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'var(--gradient-primary)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-5" style={{ background: 'var(--gradient-accent)' }}></div>
        
        {/* Tech circuit pattern - adjusted for white theme */}
        <div className="absolute top-0 right-0 w-full h-full opacity-5">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <path d="M0 200 L100 200 L120 180 L140 200 L200 200 L220 220 L240 200 L400 200" stroke="currentColor" strokeWidth="2" className="text-primary"/>
            <path d="M200 0 L200 100 L180 120 L200 140 L200 200 L220 220 L200 240 L200 400" stroke="currentColor" strokeWidth="2" className="text-primary"/>
            <circle cx="200" cy="200" r="5" fill="currentColor" className="text-primary"/>
            <circle cx="120" cy="180" r="3" fill="currentColor" className="text-accent"/>
            <circle cx="220" cy="220" r="3" fill="currentColor" className="text-accent"/>
          </svg>
        </div>
      </div>
      
      {/* Hero content */}
      <div className="container-wide relative pt-32 pb-32 sm:pt-40 sm:pb-40 z-10">
        <div className="max-w-5xl mx-auto text-center perspective-container">
          {/* 3D Title with enhanced depth */}
          <div className="relative mb-8">
            <h1 className="heading-1 relative z-10 hero-content">
              <span className="gradient-text block transform-gpu mb-4" style={{ lineHeight: '1.1' }}>
                Automate crypto rewards
              </span>
              <span className="text-foreground block" style={{ lineHeight: '1.1' }}>
                for your GitHub contributors
              </span>
            </h1>
            {/* Enhanced title shadow for 3D effect */}
            <h1 className="heading-1 absolute top-2 left-2 -z-10 opacity-10 text-primary blur-sm" aria-hidden="true">
              <span className="block mb-4">Automate crypto rewards</span>
              <span className="block">for your GitHub contributors</span>
            </h1>
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl leading-relaxed text-foreground/80 max-w-4xl mx-auto backdrop-blur-md bg-white/60 rounded-3xl p-8 border border-border/50 shadow-2xl">
            Set bounties on GitHub issues and automatically pay contributors in cryptocurrency when their pull requests are merged. 
            <span className="text-primary font-semibold block mt-2">
              Zero manual work. Maximum contributor satisfaction.
            </span>
          </p>

          {/* Stats Section */}
          <div className="mt-16 mb-12 stats-grid max-w-3xl mx-auto">
            <div className="card-3d rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-primary">$50K+</div>
              <div className="text-sm text-foreground/70 mt-1">Payouts Processed</div>
            </div>
            <div className="card-3d rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-foreground/70 mt-1">Active Repositories</div>
            </div>
            <div className="card-3d rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-primary">2.5%</div>
              <div className="text-sm text-foreground/70 mt-1">Simple Fee</div>
            </div>
          </div>
          
          {/* Enhanced 3D Button container */}
          <div className="mt-12 perspective-container">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 transform-gpu">
              <Button asChild size="lg" className="text-lg px-12 py-8 card-3d border-0 glow-effect relative overflow-hidden group min-w-[280px]">
                <Link to="/auth">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-90 group-hover:opacity-100 transition-all duration-500 shimmer-effect"></div>
                  <Github className="mr-3 h-6 w-6 relative z-10" />
                  <span className="relative z-10 font-semibold">Start Automating Payouts</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-12 py-8 card-3d border-primary/50 bg-white/80 backdrop-blur-md hover:bg-white/90 min-w-[240px]">
                <Link to="/docs">
                  <span className="text-foreground">View Documentation</span>
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-foreground/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
                <span>Real-time payouts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full pulse-glow"></div>
                <span>Secure & automated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full pulse-glow"></div>
                <span>7-day free trial</span>
              </div>
            </div>
          </div>
          
          {/* Floating crypto symbols */}
          <div className="absolute top-20 left-20 text-primary/30 floating-3d" style={{ animationDelay: '1s' }}>
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div className="absolute bottom-20 right-20 text-accent/30 floating-3d" style={{ animationDelay: '3s' }}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
