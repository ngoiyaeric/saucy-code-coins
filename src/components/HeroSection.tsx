
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-b from-background to-background/80 pt-20">
      {/* Background pattern/gradient */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-saucy-500 to-blue-600 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      
      {/* Hero content */}
      <div className="container-wide relative pt-20 pb-24 sm:pt-32 sm:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="heading-1">
            <span className="gradient-text">Reward contributors </span> 
            for their open-source work
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-8 text-foreground/80 max-w-2xl mx-auto">
            Set bounties on GitHub issues and automatically pay contributors when their pull requests are merged. No more manual payouts or contributor chasing.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="text-base px-8 py-6">
              <Link to="/auth/login">
                <Github className="mr-2 h-5 w-5" />
                Get Started for Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 py-6">
              <Link to="/docs">
                Read Documentation
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
