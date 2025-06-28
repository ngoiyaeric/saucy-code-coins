
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  Github, 
  Users, 
  Target, 
  Heart,
  ArrowRight
} from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Open Source First",
      description: "We believe in the power of open source software and want to make it sustainable for everyone."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community Driven",
      description: "Our platform is built by developers, for developers, with the community at the center of everything we do."
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Fair Compensation",
      description: "Every contributor deserves to be fairly compensated for their time and effort in building great software."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container-wide pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="heading-1 mb-6">
            About <span className="gradient-text">Saucy</span>
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            We're on a mission to make open source development sustainable by connecting projects with contributors through automated crypto payments.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-foreground/80 mb-8">
              Open source software powers the world, but most contributors aren't fairly compensated for their work. 
              We're changing that by making it easy for projects to reward contributors automatically when their code is merged.
            </p>
            <div className="bg-gradient-to-br from-saucy-50 to-blue-50 rounded-2xl p-8">
              <p className="text-xl font-medium text-foreground">
                "Every line of code that makes software better deserves recognition and reward."
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="bg-saucy-500/10 rounded-lg p-4 text-saucy-500 mx-auto w-fit mb-4">
                    {value.icon}
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                  <CardDescription className="text-base">
                    {value.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Whether you're a project maintainer or a contributor, Saucy helps create a more sustainable open source ecosystem.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth">
                <Github className="mr-2 h-5 w-5" />
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/features">
                Learn More
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

export default About;
