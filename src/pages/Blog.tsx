import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Clock, Calendar } from '@/lib/icons';
import { blogPosts } from '@/data/blogPosts';

export default function Blog() {
  return (
    <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
      <SEOHead
        title="Blog - Cannabis Education & Industry News"
        description="Stay informed about cannabis culture, laws, and strains. Educational articles from Minnesota's premier cannabis dispensary."
        url="https://dankdealsmn.com/blog"
      />
      <DesktopHeader />
      <MobileHeader title="Blog" />

      <div className="max-w-6xl mx-auto px-4 pt-6 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cannabis Education & News
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed with the latest cannabis education, strain reviews, and industry updates
            from Minnesota's experts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block group">
              <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      <Clock className="inline-block mr-1 h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {post.excerpt}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span>By {post.author}</span>
                  </div>
                  {post.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Featured Categories */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['Education', 'Guide', 'Legal', 'Reviews'].map((category) => {
              const categoryPosts = blogPosts.filter((post) => post.category === category);
              return (
                <div
                  key={category}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg mb-2">{category}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {categoryPosts.length} article{categoryPosts.length !== 1 ? 's' : ''}
                  </p>
                  <div className="text-xs space-y-1">
                    {categoryPosts.slice(0, 2).map((post) => (
                      <Link
                        key={post.slug}
                        to={`/blog/${post.slug}`}
                        className="block text-primary hover:underline line-clamp-1"
                      >
                        {post.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
