import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const blogPosts = [
  {
    title: "Understanding Cannabis Strains: Indica vs Sativa vs Hybrid",
    excerpt: "Learn about the differences between cannabis strains and how to choose the right one for your needs.",
    category: "Education",
    date: "December 15, 2024",
    readTime: "5 min read"
  },
  {
    title: "The Complete Guide to Cannabis Edibles",
    excerpt: "Everything you need to know about dosing, timing, and enjoying cannabis edibles safely.",
    category: "Guide",
    date: "December 10, 2024",
    readTime: "8 min read"
  },
  {
    title: "Cannabis Storage Tips: Keeping Your Products Fresh",
    excerpt: "Best practices for storing cannabis flower, edibles, and concentrates to maintain quality.",
    category: "Tips",
    date: "December 5, 2024",
    readTime: "4 min read"
  },
  {
    title: "New Product Alert: Premium Pre-Rolls Now Available",
    excerpt: "We're excited to announce our new line of premium pre-rolls from top local growers.",
    category: "News",
    date: "December 1, 2024",
    readTime: "2 min read"
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Blog" />
      
      <div className="max-w-md mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Latest Articles
        </h2>
        
        <div className="space-y-4">
          {blogPosts.map((post, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {post.readTime}
                  </span>
                </div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {post.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}