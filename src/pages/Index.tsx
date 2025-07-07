
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Enhanced workflow steps with more detail
const workflowSteps = [
  {
    number: "1",
    title: "Install GitHub App",
    description:
      "Connect your repositories in seconds. Our GitHub App automatically tracks pull requests and issue bounties across all your projects.",
    icon: "🔗"
  },
  {
    number: "2", 
    title: "Set bounties on issues",
    description:
      "Add bounty labels to GitHub issues with crypto amounts. Support for Bitcoin, Ethereum, and 50+ other cryptocurrencies.",
    icon: "💰"
  },
  {
    number: "3",
    title: "Contributors get to work",
    description:
      "Developers see bounty amounts and start working on issues. Clear incentives lead to faster, higher-quality contributions.",
    icon: "⚡"
  },
  {
    number: "4",
    title: "Automatic crypto payouts",
    description:
      "When you merge a PR, contributors instantly receive a claim link. Payments are processed automatically via Coinbase.",
    icon: "🚀"
  },
];

// Enhanced testimonials with more credibility
const testimonials = [
  {
    quote:
      "Saucy transformed our open-source project. We've processed over $15K in bounties and our contribution rate increased by 300%. Game changer!",
    author: "Sarah Chen",
    role: "Lead Developer at TechFlow",
    avatar: "SC"
  },
  {
    quote:
      "As a freelance developer, Saucy gives me confidence that I'll actually get paid for my contributions. The automatic payouts are brilliant.",
    author: "Marcus Rodriguez", 
    role: "Full-stack Developer",
    avatar: "MR"
  },
  {
    quote:
      "We went from manually processing bounty payments to complete automation. Saucy saved us 20+ hours per month and eliminated payment disputes.",
    author: "Alex Kim",
    role: "OSS Maintainer at DevCore",
    avatar: "AK"
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Feature Section */}
      <FeatureSection />
      
      {/* How It Works Section */}
      <section className="relative py-40 tech-grid">
        <div className="container-wide relative z-10">
          <div className="text-center mb-24 perspective-container">
            <h2 className="heading-2 text-primary mb-8" style={{ lineHeight: '1.2' }}>How Saucy Works</h2>
            <p className="text-xl text-foreground/90 max-w-3xl mx-auto leading-relaxed">
              A simple 4-step process that saves hours of manual work and gets contributors paid instantly.
            </p>
          </div>
          
          {/* Enhanced 3D Workflow Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 perspective-container">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Enhanced connection line for larger screens */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-8 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60 z-0 shimmer-effect"></div>
                )}
                
                <div className="card-3d rounded-3xl p-8 h-full group-hover:scale-105 transition-all duration-500 relative overflow-hidden">
                  {/* Enhanced floating step number */}
                  <div className="absolute -top-8 left-8 w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl glow-effect z-10 text-white shadow-2xl" 
                       style={{ background: 'var(--gradient-primary)' }}>
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="text-4xl mb-4 mt-8">{step.icon}</div>
                  
                  {/* Step content */}
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold mb-4 text-foreground">{step.title}</h3>
                    <p className="text-foreground/80 leading-relaxed text-sm">{step.description}</p>
                  </div>
                  
                  {/* Enhanced tech decoration */}
                  <div className="absolute bottom-4 right-4 w-8 h-8 opacity-10">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  
                  {/* Subtle shimmer overlay */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-effect"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced 3D CTA Button */}
          <div className="text-center mt-20 perspective-container">
            <Button asChild size="lg" className="text-lg px-16 py-10 card-3d border-0 glow-effect relative overflow-hidden group">
              <Link to="/auth">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-90 group-hover:opacity-100 transition-opacity animate-pulse shimmer-effect"></div>
                <span className="relative z-10 font-semibold">Try Saucy Free for 7 Days</span>
              </Link>
            </Button>
            <p className="mt-4 text-sm text-foreground/60">No credit card required • Setup in under 5 minutes</p>
          </div>
        </div>
        
        {/* Background floating elements - adjusted for white theme */}
        <div className="absolute top-20 right-10 w-16 h-16 bg-accent/5 rounded-full floating-3d border border-accent/20" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-10 w-12 h-12 bg-primary/5 rounded-lg floating-3d transform rotate-45 border border-primary/20" style={{ animationDelay: '3s' }}></div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-32 relative overflow-hidden bg-secondary/30">
        {/* Background tech pattern - adjusted for white theme */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-0 left-0 w-full h-full" style={{ 
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, hsl(var(--accent)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px, 30px 30px'
          }}></div>
        </div>
        
        <div className="container-wide relative z-10">
          <div className="text-center mb-20 perspective-container">
            <h2 className="heading-2 text-primary mb-8" style={{ lineHeight: '1.2' }}>Trusted by Open Source Communities</h2>
            <p className="text-lg text-foreground/90 max-w-2xl mx-auto">
              See what maintainers and contributors are saying about Saucy.
            </p>
          </div>
          
          {/* Enhanced 3D Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-10 perspective-container">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group">
                <div className="card-3d rounded-3xl p-8 h-full relative overflow-hidden group-hover:scale-105 transition-all duration-500">
                  {/* Quote decoration */}
                  <div className="absolute top-4 right-4 text-8xl text-primary/10 font-serif">&ldquo;</div>
                  
                  {/* Avatar */}
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                      <p className="text-xs text-foreground/70">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  {/* Testimonial content */}
                  <div className="relative z-10">
                    <p className="text-base leading-relaxed mb-6 text-foreground/90 italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                  </div>
                  
                  {/* Enhanced glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-effect"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Floating testimonial decorations */}
        <div className="absolute top-40 left-20 text-primary/20 floating-3d" style={{ animationDelay: '2s' }}>
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
        <div className="absolute bottom-40 right-20 text-accent/20 floating-3d" style={{ animationDelay: '4s' }}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 11H7v3h2v-3zm4 0h-2v3h2v-3zm4 0h-2v3h2v-3zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
          </svg>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden" style={{ background: 'var(--gradient-accent)' }}>
        {/* 3D Background Elements */}
        <div className="absolute inset-0">
          {/* Animated geometric shapes */}
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-lg floating-3d transform rotate-12" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-20 right-20 w-24 h-24 border-2 border-white/20 rounded-full floating-3d" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-white/20 rounded-lg floating-3d transform rotate-45" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-white/20 rounded-full floating-3d" style={{ animationDelay: '1s' }}></div>
          
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="container-wide relative z-10">
          <div className="text-center perspective-container">
            {/* 3D Title */}
            <div className="relative mb-8">
              <h2 className="heading-2 text-white relative z-10">Ready to reward your contributors?</h2>
              <h2 className="heading-2 absolute top-1 left-1 -z-10 opacity-20 text-white/50" aria-hidden="true">
                Ready to reward your contributors?
              </h2>
            </div>
            
            <p className="text-lg text-white/90 max-w-3xl mx-auto mb-12 backdrop-blur-sm bg-white/20 rounded-2xl p-6 border border-white/30">
              Start automating your open-source payments today and focus on what matters: 
              <span className="font-semibold text-white"> building great software.</span>
            </p>
            
            {/* 3D Button Group */}
            <div className="flex items-center justify-center gap-x-8 perspective-container">
              <Button asChild size="lg" className="text-base px-12 py-8 bg-white text-background hover:bg-white/90 card-3d border-0 font-semibold relative overflow-hidden group">
                <Link to="/auth">
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-white/90 group-hover:from-white/90 group-hover:to-white transition-all"></div>
                  <span className="relative z-10">Sign Up for Free</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-12 py-8 border-white/50 text-white hover:bg-white/10 card-3d bg-white/10 backdrop-blur-sm">
                <Link to="/docs">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating tech icons */}
        <div className="absolute top-40 left-1/4 text-white/20 floating-3d" style={{ animationDelay: '3s' }}>
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L16 8L24 12L16 16L12 24L8 16L0 12L8 8L12 0Z"/>
          </svg>
        </div>
        <div className="absolute bottom-40 right-1/4 text-white/20 floating-3d" style={{ animationDelay: '5s' }}>
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16L12 13.5 15.5 16 12 18.5 8.5 16z"/>
          </svg>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
