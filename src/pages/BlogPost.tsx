import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowLeftIcon } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogContent from "@/components/BlogContent";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published_at: string;
  tags: string[];
  featured_image_url?: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, published_at, tags, featured_image_url')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        throw error;
      } else if (!data) {
        // No post found with this slug
        setNotFound(true);
      } else {
        setPost(data);
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-muted rounded w-3/4 mb-6"></div>
            <div className="h-6 bg-muted rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />
      
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-8 group">
            <ArrowLeftIcon className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Blog</span>
          </Link>

          {post.featured_image_url && (
            <div className="aspect-video overflow-hidden rounded-xl mb-12 shadow-lg">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <time dateTime={post.published_at} className="font-medium">
                  {format(new Date(post.published_at), 'MMMM dd, yyyy')}
                </time>
              </div>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          <div className="prose-container">
            <BlogContent content={post.content} />
          </div>

          {/* Reading progress indicator */}
          <div className="mt-16 pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <Link 
                to="/blog" 
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors group"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">More Articles</span>
              </Link>
              
              <div className="text-sm text-muted-foreground">
                Published {format(new Date(post.published_at), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;