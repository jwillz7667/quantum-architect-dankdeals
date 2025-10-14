// src/pages/BlogPost.tsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, Calendar, User } from '@/lib/icons';
import { blogPosts } from '@/data/blogPosts';
import DOMPurify from 'dompurify';

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const breadcrumbs = [
    { name: 'Home', url: 'https://dankdealsmn.com/' },
    { name: 'Blog', url: 'https://dankdealsmn.com/blog' },
    { name: post.title, url: `https://dankdealsmn.com/blog/${post.slug}` },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `https://dankdealsmn.com${post.image}`,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'DankDeals MN',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dankdealsmn.com/apple-touch-icon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://dankdealsmn.com/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
      <SEOHead
        title={post.title}
        description={post.excerpt}
        canonicalUrl={`https://dankdealsmn.com/blog/${post.slug}`}
        article={true}
        image={post.image}
        structuredData={structuredData}
        breadcrumbs={breadcrumbs}
      />
      <DesktopHeader />
      <MobileHeader title="Blog" />

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
        <Link to="/blog">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>

        <article className="prose prose-gray dark:prose-invert max-w-none">
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{post.category}</Badge>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
          </header>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content, {
                ALLOWED_TAGS: [
                  'h1',
                  'h2',
                  'h3',
                  'h4',
                  'h5',
                  'h6',
                  'p',
                  'ul',
                  'ol',
                  'li',
                  'strong',
                  'em',
                  'br',
                  'table',
                  'tr',
                  'th',
                  'td',
                ],
                ALLOWED_ATTR: [],
                FORBID_TAGS: ['script', 'style'],
              }),
            }}
          />
        </article>

        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-4">More Articles</h2>
          <div className="grid gap-4">
            {blogPosts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 3)
              .map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  to={`/blog/${relatedPost.slug}`}
                  className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold mb-2">{relatedPost.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{relatedPost.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{relatedPost.date}</span>
                    <span>{relatedPost.readTime}</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
