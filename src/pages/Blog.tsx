
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';

const Blog = () => {
  const blogPosts = [
    {
      title: "The Future of Open Source Funding",
      excerpt: "Exploring how crypto payments are revolutionizing the way we fund open source development and why it matters for the future of software.",
      author: "Saucy Team",
      date: "2024-06-15",
      readTime: "5 min read",
      category: "Open Source",
      featured: true
    },
    {
      title: "Getting Started with Automated Bounties",
      excerpt: "A comprehensive guide to setting up your first GitHub bounties and automating payments to contributors.",
      author: "Saucy Team", 
      date: "2024-06-10",
      readTime: "8 min read",
      category: "Tutorial"
    },
    {
      title: "Why Contributors Love Crypto Payments",
      excerpt: "Hear from developers around the world about how instant crypto payments have changed their open source contribution experience.",
      author: "Saucy Team",
      date: "2024-06-05", 
      readTime: "6 min read",
      category: "Community"
    },
    {
      title: "Building Sustainable Open Source Projects",
      excerpt: "Learn how successful projects are using bounty systems to maintain momentum and attract quality contributors.",
      author: "Saucy Team",
      date: "2024-05-30",
      readTime: "7 min read",
      category: "Best Practices"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container-wide pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="heading-1 mb-6">
            <span className="gradient-text">Saucy Blog</span>
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Insights, tutorials, and stories from the world of open source development and automated contributor rewards.
          </p>
        </div>

        {/* Featured Post */}
        {blogPosts.filter(post => post.featured).map((post, index) => (
          <Card key={index} className="mb-12 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gradient-to-br from-saucy-500 to-blue-600 p-8 flex items-center justify-center">
                <div className="text-white text-center">
                  <Badge variant="secondary" className="mb-4">Featured</Badge>
                  <h3 className="text-2xl font-bold">Latest Post</h3>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{post.category}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3">{post.title}</h2>
                <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                <Button>
                  Read More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.filter(post => !post.featured).map((post, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{post.category}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-saucy-500 transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </div>
                <Button variant="ghost" className="w-full mt-4 group-hover:bg-saucy-50">
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-br from-saucy-50 to-blue-50 rounded-2xl p-8 text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-foreground/80 mb-6 max-w-2xl mx-auto">
            Get the latest insights on open source development, contributor rewards, and platform updates delivered to your inbox.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link to="/auth">
                Subscribe to Updates
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

export default Blog;
