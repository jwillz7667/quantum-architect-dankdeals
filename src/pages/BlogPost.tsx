// src/pages/BlogPost.tsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, Calendar, User } from 'lucide-react';
import DOMPurify from 'dompurify';

// Blog posts data - in production, this would come from a database
const blogPosts = [
  {
    id: 'understanding-terpenes-cannabis-flavor-effects',
    slug: 'understanding-terpenes-cannabis-flavor-effects',
    title: 'Understanding Terpenes: The Secret Behind Cannabis Flavor and Effects',
    excerpt:
      'Discover how terpenes influence the taste, aroma, and effects of cannabis strains. Learn about common terpenes and their therapeutic benefits.',
    content: `
      <h2>What Are Terpenes?</h2>
      <p>Terpenes are aromatic compounds found in many plants, including cannabis. These organic compounds are responsible for the distinctive flavors and aromas of different cannabis strains – from the citrusy smell of Super Lemon Haze to the earthy, pine notes of OG Kush.</p>
      
      <h2>The Science Behind Terpenes</h2>
      <p>While THC and CBD get most of the attention, terpenes play a crucial role in the cannabis experience through what's known as the "entourage effect." This phenomenon describes how cannabinoids and terpenes work together synergistically to enhance or modify the effects of cannabis.</p>
      
      <h3>Common Cannabis Terpenes and Their Effects</h3>
      
      <h4>Myrcene</h4>
      <p>The most abundant terpene in cannabis, myrcene has an earthy, musky aroma with hints of fruity notes. Found in mangoes, hops, and thyme, myrcene is known for its sedating effects and may enhance THC's psychoactive properties.</p>
      
      <h4>Limonene</h4>
      <p>As its name suggests, limonene provides a citrusy aroma and is also found in lemon rinds and orange peels. This terpene is associated with elevated mood and stress relief, making it popular in daytime strains.</p>
      
      <h4>Pinene</h4>
      <p>The most common terpene in nature, pinene smells exactly like pine trees. It's known for promoting alertness and memory retention, potentially counteracting some of THC's short-term memory effects.</p>
      
      <h4>Linalool</h4>
      <p>Famous for giving lavender its distinctive scent, linalool has calming and anti-anxiety properties. It's often found in strains marketed for relaxation and sleep.</p>
      
      <h4>Caryophyllene</h4>
      <p>The only terpene that also acts as a cannabinoid, caryophyllene has a spicy, peppery aroma. It may help reduce inflammation and provide pain relief.</p>
      
      <h2>How to Choose Strains Based on Terpenes</h2>
      <p>When selecting cannabis products, consider the terpene profile alongside THC and CBD content. Many dispensaries now provide terpene testing results, allowing you to make more informed choices based on desired effects.</p>
      
      <h3>Tips for Terpene Shopping:</h3>
      <ul>
        <li>Ask your budtender about terpene profiles</li>
        <li>Smell the product (when possible) to identify dominant terpenes</li>
        <li>Keep a journal of strains and their effects to identify your preferred terpene combinations</li>
        <li>Start with strains high in single terpenes to understand individual effects</li>
      </ul>
      
      <h2>Preserving Terpenes</h2>
      <p>Terpenes are volatile compounds that can degrade over time. To maintain your cannabis's terpene profile:</p>
      <ul>
        <li>Store in airtight containers away from light</li>
        <li>Keep at moderate temperatures (60-70°F)</li>
        <li>Avoid excessive handling</li>
        <li>Use within 6-12 months of purchase</li>
      </ul>
      
      <p>Understanding terpenes empowers you to make more informed cannabis choices, moving beyond simply looking at THC percentages to find strains that truly meet your needs.</p>
    `,
    category: 'Education',
    author: 'Dr. Sarah Chen',
    date: 'January 8, 2025',
    readTime: '7 min read',
    tags: ['terpenes', 'cannabis science', 'strain selection'],
    image: '/blog/terpenes-guide.jpg',
  },
  {
    id: 'cannabis-edibles-dosing-guide-beginners',
    slug: 'cannabis-edibles-dosing-guide-beginners',
    title: 'The Complete Guide to Cannabis Edibles Dosing for Beginners',
    excerpt:
      'Learn how to safely dose cannabis edibles with our comprehensive guide. Understand onset times, duration, and how to avoid common mistakes.',
    content: `
      <h2>Why Edibles Are Different</h2>
      <p>Cannabis edibles offer a unique consumption method that differs significantly from smoking or vaping. When you eat cannabis, it's processed through your digestive system and liver, converting THC into 11-hydroxy-THC, a more potent compound that can produce stronger and longer-lasting effects.</p>
      
      <h2>The Golden Rule: Start Low and Go Slow</h2>
      <p>The most important principle for edible consumption is patience. Unlike smoking, which produces effects within minutes, edibles can take 30 minutes to 2 hours to kick in, with peak effects occurring 2-4 hours after consumption.</p>
      
      <h3>Recommended Starting Doses</h3>
      
      <h4>First-Time Users: 2.5mg THC</h4>
      <p>If you've never used cannabis before, start with 2.5mg of THC. This microdose allows you to gauge your sensitivity without overwhelming effects.</p>
      
      <h4>Occasional Users: 5mg THC</h4>
      <p>Those with some cannabis experience but limited tolerance should begin with 5mg, the standard "single dose" in many legal markets.</p>
      
      <h4>Regular Users: 10-15mg THC</h4>
      <p>Experienced consumers with established tolerance may start with 10-15mg, though even regular smokers should be cautious with edibles due to the different metabolism.</p>
      
      <h2>Understanding Onset and Duration</h2>
      <table>
        <tr>
          <th>Factor</th>
          <th>Time Range</th>
        </tr>
        <tr>
          <td>Onset</td>
          <td>30 minutes - 2 hours</td>
        </tr>
        <tr>
          <td>Peak Effects</td>
          <td>2-4 hours</td>
        </tr>
        <tr>
          <td>Total Duration</td>
          <td>4-8 hours (sometimes longer)</td>
        </tr>
      </table>
      
      <h2>Factors Affecting Edible Experience</h2>
      
      <h3>Metabolism and Body Composition</h3>
      <p>Your metabolic rate, body weight, and composition all influence how quickly and intensely you'll feel effects. Those with faster metabolisms may experience quicker onset but shorter duration.</p>
      
      <h3>Stomach Contents</h3>
      <p>Taking edibles on an empty stomach typically results in faster onset and stronger effects. Consuming with fatty foods can enhance absorption but may delay onset.</p>
      
      <h3>Tolerance</h3>
      <p>Regular cannabis use builds tolerance, but edible tolerance develops separately from smoking tolerance. Don't assume your smoking tolerance translates directly to edibles.</p>
      
      <h2>Common Mistakes to Avoid</h2>
      
      <h3>1. Redosing Too Soon</h3>
      <p>The #1 mistake: taking more because "it's not working" after 30-45 minutes. Always wait at least 2 hours before considering an additional dose.</p>
      
      <h3>2. Inconsistent Products</h3>
      <p>Homemade edibles often have inconsistent dosing. Stick to lab-tested products from licensed dispensaries for reliable dosing.</p>
      
      <h3>3. Mixing with Alcohol</h3>
      <p>Alcohol can intensify cannabis effects unpredictably. Avoid mixing, especially when you're still learning your edible tolerance.</p>
      
      <h2>What If You Take Too Much?</h2>
      <p>If you've consumed too much, remember:</p>
      <ul>
        <li>You cannot fatally overdose on cannabis</li>
        <li>Effects will pass, typically within 4-6 hours</li>
        <li>Find a calm, comfortable space</li>
        <li>Stay hydrated</li>
        <li>Try CBD to potentially counteract THC effects</li>
        <li>Sleep it off if possible</li>
      </ul>
      
      <h2>Tips for Success</h2>
      <ul>
        <li>Keep a consumption journal to track doses and effects</li>
        <li>Have non-infused snacks available to avoid accidental overconsumption</li>
        <li>Clear your schedule – don't drive or operate machinery</li>
        <li>Start your edible journey in a comfortable, familiar environment</li>
        <li>Consider having a sober friend present for your first experience</li>
      </ul>
      
      <p>Remember, everyone's endocannabinoid system is unique. What works for others may not work for you. Take time to find your optimal dose, and always prioritize safety over intensity.</p>
    `,
    category: 'Guide',
    author: 'Marcus Johnson, Cannabis Educator',
    date: 'January 6, 2025',
    readTime: '10 min read',
    tags: ['edibles', 'dosing', 'beginners', 'safety'],
    image: '/blog/edibles-guide.jpg',
  },
  {
    id: 'minnesota-cannabis-laws-2025-update',
    slug: 'minnesota-cannabis-laws-2025-update',
    title: 'Minnesota Cannabis Laws 2025: What You Need to Know',
    excerpt:
      "Stay informed about Minnesota's cannabis regulations in 2025. Understand possession limits, home cultivation rules, and where you can legally consume.",
    content: `
      <h2>Minnesota's Cannabis Landscape in 2025</h2>
      <p>As we enter 2025, Minnesota's cannabis laws continue to evolve. Whether you're a long-time resident or new to the state, understanding these regulations is crucial for responsible and legal cannabis consumption.</p>
      
      <h2>Legal Possession Limits</h2>
      
      <h3>For Adults 21 and Over</h3>
      <ul>
        <li><strong>At Home:</strong> Up to 2 pounds of cannabis flower</li>
        <li><strong>In Public:</strong> Up to 2 ounces of cannabis flower</li>
        <li><strong>Concentrates:</strong> Up to 8 grams of THC in concentrate form</li>
        <li><strong>Edibles:</strong> Up to 800mg of THC in edible products</li>
      </ul>
      
      <h3>Important Notes</h3>
      <p>These limits apply per person, not per household. Possession by anyone under 21 remains illegal, with exceptions for registered medical patients.</p>
      
      <h2>Home Cultivation Rules</h2>
      <p>Minnesota allows limited home cultivation for personal use:</p>
      <ul>
        <li>Up to 8 plants per household (not per person)</li>
        <li>Maximum of 4 flowering plants at any time</li>
        <li>Plants must be in an enclosed, locked space</li>
        <li>Not visible from public spaces without binoculars or aircraft</li>
        <li>Renters need landlord permission</li>
      </ul>
      
      <h2>Where You Can and Cannot Consume</h2>
      
      <h3>Legal Consumption Areas</h3>
      <ul>
        <li>Private residences (with property owner permission)</li>
        <li>Licensed consumption lounges (limited availability)</li>
        <li>Designated areas at certain events</li>
      </ul>
      
      <h3>Prohibited Areas</h3>
      <ul>
        <li>Public spaces (parks, sidewalks, streets)</li>
        <li>Vehicles (as driver or passenger)</li>
        <li>Schools and school buses</li>
        <li>Correctional facilities</li>
        <li>State-owned buildings</li>
        <li>Where smoking tobacco is prohibited</li>
      </ul>
      
      <h2>Driving and Cannabis</h2>
      <p>Driving under the influence of cannabis remains illegal. Key points:</p>
      <ul>
        <li>No open cannabis containers in vehicles</li>
        <li>Store cannabis in trunk or locked glove compartment</li>
        <li>DWI laws apply to cannabis impairment</li>
        <li>No legal THC limit – impairment is determined by officer observation</li>
      </ul>
      
      <h2>Employment Considerations</h2>
      <p>Despite legalization, employers maintain significant rights:</p>
      <ul>
        <li>Can maintain drug-free workplace policies</li>
        <li>May test for cannabis (with some restrictions)</li>
        <li>Can prohibit use during work hours</li>
        <li>Cannot discriminate against off-duty legal use (with exceptions)</li>
      </ul>
      
      <h2>Purchasing Cannabis</h2>
      
      <h3>Licensed Retailers Only</h3>
      <p>Cannabis must be purchased from state-licensed dispensaries. Buying from unlicensed sources remains illegal and may result in:</p>
      <ul>
        <li>Fines up to $1,000</li>
        <li>Potential misdemeanor charges</li>
        <li>No quality or safety guarantees</li>
      </ul>
      
      <h3>Valid ID Required</h3>
      <p>All customers must present valid, government-issued photo ID proving they're 21 or older. Acceptable forms include:</p>
      <ul>
        <li>Driver's license</li>
        <li>State ID card</li>
        <li>Passport</li>
        <li>Military ID</li>
      </ul>
      
      <h2>Traveling with Cannabis</h2>
      
      <h3>Within Minnesota</h3>
      <p>You may transport legal amounts within state borders, following storage requirements for vehicles.</p>
      
      <h3>Crossing State Lines</h3>
      <p>Transporting cannabis across state lines remains federally illegal, even to other legal states. This includes:</p>
      <ul>
        <li>Driving to Wisconsin, Iowa, North Dakota, or South Dakota</li>
        <li>Flying (cannabis is prohibited in airports and on planes)</li>
        <li>Mailing or shipping cannabis</li>
      </ul>
      
      <h2>Medical Cannabis Program</h2>
      <p>Minnesota's medical program continues alongside adult-use legalization, offering:</p>
      <ul>
        <li>Access for patients under 21</li>
        <li>Higher possession limits</li>
        <li>Potential employment protections</li>
        <li>Tax advantages</li>
      </ul>
      
      <h2>Looking Ahead</h2>
      <p>Cannabis laws continue to evolve. Proposed changes for 2025 include:</p>
      <ul>
        <li>Expanded consumption lounge licensing</li>
        <li>Social equity program implementation</li>
        <li>Interstate commerce discussions</li>
        <li>Enhanced DWI testing protocols</li>
      </ul>
      
      <h2>Stay Informed</h2>
      <p>Laws can change quickly. Always verify current regulations through official state resources before making decisions about cannabis use, cultivation, or business activities.</p>
      
      <p><em>Disclaimer: This article provides general information about Minnesota cannabis laws as of January 2025. It should not be considered legal advice. Consult with a qualified attorney for specific legal questions.</em></p>
    `,
    category: 'Legal',
    author: 'Legal Team',
    date: 'January 5, 2025',
    readTime: '12 min read',
    tags: ['minnesota', 'legal', 'regulations', '2025'],
    image: '/blog/mn-cannabis-laws.jpg',
  },
  {
    id: 'best-cannabis-strains-winter-2025',
    slug: 'best-cannabis-strains-winter-2025',
    title: 'Top 5 Cannabis Strains for Minnesota Winter 2025',
    excerpt:
      'Beat the winter blues with our curated selection of cannabis strains perfect for cold Minnesota nights and cozy indoor sessions.',
    content: `
      <h2>Embracing Winter with the Right Cannabis</h2>
      <p>Minnesota winters are legendary for their intensity, but they're also a time for cozy indoor gatherings, winter sports, and finding warmth in small pleasures. We've curated five exceptional strains that complement the winter season, whether you're looking to energize your snow day adventures or settle in for a peaceful evening by the fireplace.</p>
      
      <h2>1. Northern Lights - The Minnesota Classic</h2>
      
      <h3>Profile</h3>
      <ul>
        <li><strong>Type:</strong> Indica-dominant (95% Indica / 5% Sativa)</li>
        <li><strong>THC:</strong> 16-21%</li>
        <li><strong>Dominant Terpenes:</strong> Myrcene, Caryophyllene, Limonene</li>
      </ul>
      
      <h3>Why It's Perfect for Winter</h3>
      <p>Named after our state's most beautiful natural phenomenon, Northern Lights delivers a deeply relaxing experience that's ideal for long winter evenings. Its earthy, pine-scented profile reminds you of Minnesota's snow-covered forests, while its effects provide full-body relaxation that melts away the tension from shoveling snow or battling icy commutes.</p>
      
      <h3>Best For</h3>
      <ul>
        <li>Evening relaxation after outdoor activities</li>
        <li>Managing seasonal aches and pains</li>
        <li>Promoting deep, restful sleep</li>
        <li>Movie nights and cozy indoor activities</li>
      </ul>
      
      <h2>2. Jack Frost - The Energizing Hybrid</h2>
      
      <h3>Profile</h3>
      <ul>
        <li><strong>Type:</strong> Hybrid (55% Sativa / 45% Indica)</li>
        <li><strong>THC:</strong> 19-23%</li>
        <li><strong>Dominant Terpenes:</strong> Terpinolene, Pinene, Ocimene</li>
      </ul>
      
      <h3>Why It's Perfect for Winter</h3>
      <p>Don't let its frosty name fool you – Jack Frost brings warmth and energy to combat seasonal fatigue. This uplifting hybrid features a crisp, citrusy flavor profile that brightens even the darkest January days. Its balanced effects provide mental clarity and physical comfort without heavy sedation.</p>
      
      <h3>Best For</h3>
      <ul>
        <li>Morning motivation on cold days</li>
        <li>Creative indoor projects</li>
        <li>Social gatherings and game nights</li>
        <li>Pre-workout for winter sports enthusiasts</li>
      </ul>
      
      <h2>3. Purple Punch - The Comfort Strain</h2>
      
      <h3>Profile</h3>
      <ul>
        <li><strong>Type:</strong> Indica-dominant (80% Indica / 20% Sativa)</li>
        <li><strong>THC:</strong> 18-20%</li>
        <li><strong>Dominant Terpenes:</strong> Caryophyllene, Limonene, Pinene</li>
      </ul>
      
      <h3>Why It's Perfect for Winter</h3>
      <p>Purple Punch is like a warm hug on a cold day. Its grape and berry flavors evoke memories of summer preserves, while its sedating effects make it perfect for hibernation mode. This strain excels at promoting comfort and contentment during the long winter months.</p>
      
      <h3>Best For</h3>
      <ul>
        <li>Weekend relaxation</li>
        <li>Comfort food pairings</li>
        <li>Managing winter blues</li>
        <li>Bedtime routine enhancement</li>
      </ul>
      
      <h2>4. Green Crack - The Productivity Powerhouse</h2>
      
      <h3>Profile</h3>
      <ul>
        <li><strong>Type:</strong> Sativa-dominant (65% Sativa / 35% Indica)</li>
        <li><strong>THC:</strong> 15-25%</li>
        <li><strong>Dominant Terpenes:</strong> Myrcene, Caryophyllene, Limonene</li>
      </ul>
      
      <h3>Why It's Perfect for Winter</h3>
      <p>When winter lethargy hits hard, Green Crack provides the antidote. Despite its intense name, this strain offers smooth, manageable energy that helps you tackle indoor projects, workout routines, or simply maintain productivity when the sun sets at 4:30 PM.</p>
      
      <h3>Best For</h3>
      <ul>
        <li>Combating seasonal affective disorder</li>
        <li>Home organization projects</li>
        <li>Daytime use without drowsiness</li>
        <li>Pre-activity energy boost</li>
      </ul>
      
      <h2>5. Wedding Cake - The Celebration Strain</h2>
      
      <h3>Profile</h3>
      <ul>
        <li><strong>Type:</strong> Indica-dominant hybrid (60% Indica / 40% Sativa)</li>
        <li><strong>THC:</strong> 22-25%</li>
        <li><strong>Dominant Terpenes:</strong> Limonene, Caryophyllene, Myrcene</li>
      </ul>
      
      <h3>Why It's Perfect for Winter</h3>
      <p>Winter holidays and gatherings call for something special, and Wedding Cake delivers. Its sweet, vanilla-tangy flavor profile pairs beautifully with seasonal treats, while its balanced effects keep you social yet relaxed during family gatherings or intimate dinner parties.</p>
      
      <h3>Best For</h3>
      <ul>
        <li>Holiday celebrations</li>
        <li>Enhancing winter comfort foods</li>
        <li>Social relaxation</li>
        <li>End-of-day unwinding</li>
      </ul>
      
      <h2>Winter Consumption Tips</h2>
      
      <h3>Storage in Cold Weather</h3>
      <p>Minnesota's extreme temperature fluctuations can affect cannabis quality:</p>
      <ul>
        <li>Store in a cool, dark place (60-70°F ideal)</li>
        <li>Avoid leaving products in cars during winter</li>
        <li>Use humidity packs to prevent over-drying</li>
        <li>Keep away from heating vents</li>
      </ul>
      
      <h3>Pairing with Winter Activities</h3>
      <ul>
        <li><strong>Ice Fishing:</strong> Low-dose sativas for focus and patience</li>
        <li><strong>Snowshoeing:</strong> Energizing hybrids for endurance</li>
        <li><strong>Netflix & Chill:</strong> Heavy indicas for maximum relaxation</li>
        <li><strong>Winter Cooking:</strong> Flavor-forward strains to enhance culinary creativity</li>
      </ul>
      
      <h2>Final Thoughts</h2>
      <p>Winter in Minnesota doesn't have to mean hibernation. With the right cannabis strains, you can enhance both your active outdoor adventures and cozy indoor moments. Remember to start low and go slow, especially when trying new strains, and always consume responsibly.</p>
      
      <p>Stay warm, Minnesota, and enjoy these carefully selected strains that complement our beautiful, challenging winter season!</p>
    `,
    category: 'Reviews',
    author: 'Jamie Thompson, Lead Budtender',
    date: 'January 3, 2025',
    readTime: '8 min read',
    tags: ['strains', 'winter', 'reviews', 'minnesota'],
    image: '/blog/winter-strains.jpg',
  },
];

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
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

      <div className="max-w-4xl mx-auto px-4 py-6">
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
