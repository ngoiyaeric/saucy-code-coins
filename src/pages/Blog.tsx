import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserIcon } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  tags: string[];
  featured_image_url?: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, published_at, tags, featured_image_url')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Database error fetching blog posts:', error);
        throw error;
      }
      
      // Ensure we have valid data
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setPosts([]); // Set empty array on error to prevent crashes
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-inter">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader className="p-8">
                  <div className="h-8 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-playfair font-bold text-foreground mb-6">
            Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Insights, updates, and stories from our journey building the future of open source collaboration.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-3xl font-playfair font-semibold text-foreground mb-4">No posts yet</h2>
            <p className="text-lg text-muted-foreground">Check back soon for our latest updates!</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {posts.map((post) => (
              <Card key={post.id} className="hover-scale group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
                <Link to={`/blog/${post.slug}`} className="block">
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardHeader className="p-8">
                    <CardTitle className="text-2xl font-playfair font-bold line-clamp-2 group-hover:text-primary transition-colors mb-3 leading-tight">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <time dateTime={post.published_at}>
                            {format(new Date(post.published_at), 'MMM dd, yyyy')}
                          </time>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <p className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed text-base">
                      {post.excerpt}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{post.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;