
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden tech-grid">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 perspective-container">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-lg floating-3d transform rotate-45" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-accent/20 rounded-full floating-3d" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-primary/30 rounded-lg floating-3d transform rotate-12" style={{ animationDelay: '4s' }}></div>
        
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full glow-effect opacity-20" style={{ background: 'var(--gradient-primary)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full glow-effect opacity-15" style={{ background: 'var(--gradient-accent)' }}></div>
        
        {/* Tech circuit pattern */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <path d="M0 200 L100 200 L120 180 L140 200 L200 200 L220 220 L240 200 L400 200" stroke="currentColor" strokeWidth="2" className="text-primary"/>
            <path d="M200 0 L200 100 L180 120 L200 140 L200 200 L220 220 L200 240 L200 400" stroke="currentColor" strokeWidth="2" className="text-primary"/>
            <circle cx="200" cy="200" r="5" fill="currentColor" className="text-primary pulse-glow"/>
            <circle cx="120" cy="180" r="3" fill="currentColor" className="text-accent"/>
            <circle cx="220" cy="220" r="3" fill="currentColor" className="text-accent"/>
          </svg>
        </div>
      </div>
      
      {/* Hero content */}
      <div className="container-wide relative pt-32 pb-32 sm:pt-40 sm:pb-40 z-10">
        <div className="max-w-4xl mx-auto text-center perspective-container">
          {/* 3D Title with depth */}
          <div className="relative">
            <h1 className="heading-1 relative z-10">
              <span className="gradient-text block transform-gpu">Reward contributors</span>
              <span className="text-foreground block mt-2">for their open-source work</span>
            </h1>
            {/* Title shadow for 3D effect */}
            <h1 className="heading-1 absolute top-1 left-1 -z-10 opacity-20 text-primary" aria-hidden="true">
              <span className="block">Reward contributors</span>
              <span className="block mt-2">for their open-source work</span>
            </h1>
          </div>
          
          <p className="mt-8 text-lg sm:text-xl leading-8 text-foreground/90 max-w-3xl mx-auto backdrop-blur-sm bg-background/30 rounded-2xl p-6 border border-border/50">
            Set bounties on GitHub issues and automatically pay contributors when their pull requests are merged. 
            <span className="gradient-text font-semibold"> No more manual payouts or contributor chasing.</span>
          </p>
          
          {/* 3D Button container */}
          <div className="mt-12 perspective-container">
            <div className="flex items-center justify-center gap-x-6 transform-gpu">
              <Button asChild size="lg" className="text-base px-8 py-6 card-3d border-0 glow-effect relative overflow-hidden group">
                <Link to="/auth">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <Github className="mr-2 h-5 w-5 relative z-10" />
                  <span className="relative z-10">Get Started for Free</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 card-3d border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                <Link to="/docs">
                  Read Documentation
                </Link>
              </Button>
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
