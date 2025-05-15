
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Example workflow steps
const workflowSteps = [
  {
    number: "1",
    title: "Connect your GitHub repositories",
    description:
      "Install the Saucy GitHub App on your repositories to enable automatic PR tracking and payment processing.",
  },
  {
    number: "2",
    title: "Set bounties on GitHub issues",
    description:
      "Tag issues with bounty amounts to attract contributors. Choose USD or cryptocurrency amounts.",
  },
  {
    number: "3",
    title: "Contributors submit pull requests",
    description:
      "Contributors work on issues and submit pull requests linking to the bounty issues.",
  },
  {
    number: "4",
    title: "Automatic payouts on merge",
    description:
      "When you merge a PR, Saucy automatically comments with a claim link for the contributor.",
  },
];

// Mock testimonial data
const testimonials = [
  {
    quote:
      "Saucy has transformed how we manage our open-source projects. Contributors are more engaged, and we're shipping features faster than ever.",
    author: "Alex Rivera",
    role: "CTO at TechStack",
  },
  {
    quote:
      "As a contributor, I love how Saucy makes payments automatic. No more chasing project owners for promised bounties.",
    author: "Jamie Chen",
    role: "Software Engineer",
  },
  {
    quote:
      "Setting up bounties for our issues has dramatically increased the quality and speed of contributions to our project.",
    author: "Taylor Morgan",
    role: "Open Source Maintainer",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Feature Section */}
      <FeatureSection />
      
      {/* How It Works Section */}
      <section className="bg-secondary/50 py-24">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="heading-2">How Saucy Works</h2>
            <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
              A simple workflow that saves you time and helps contributors get paid automatically.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative bg-background rounded-lg p-6 shadow-sm border">
                <div className="absolute -top-4 left-4 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-medium mt-4">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg" className="text-base px-8 py-6">
              <Link to="/auth/login">
                Get Started Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-24">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="heading-2">Trusted by Open Source Communities</h2>
            <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
              See what maintainers and contributors are saying about Saucy.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-sm border">
                <p className="text-lg italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-4">
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-saucy-900 text-white py-24">
        <div className="container-wide">
          <div className="text-center">
            <h2 className="heading-2 text-white">Ready to reward your contributors?</h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Start automating your open-source payments today and focus on what matters: building great software.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="text-base px-8 py-6 bg-white text-saucy-900 hover:bg-white/90">
                <Link to="/auth/login">
                  Sign Up for Free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 border-white text-white hover:bg-white/10">
                <Link to="/docs">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
