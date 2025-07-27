import { useEffect } from 'react';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, DollarSign, CheckCircle, Phone } from '@/lib/icons';

export default function DeliveryArea() {
  useEffect(() => {
    // SEO meta tags
    document.title =
      'Cannabis Delivery Areas Minnesota | Same-Day Marijuana Delivery | DankDeals MN';

    // Create or update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      'Fast, reliable cannabis delivery across Minnesota. Licensed marijuana delivery service with same-day delivery to Minneapolis, St. Paul, and surrounding areas. View delivery zones and fees.'
    );

    // Keywords meta tag
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute(
      'content',
      'cannabis delivery Minnesota, marijuana delivery Minneapolis, weed delivery St Paul, same-day cannabis delivery, licensed marijuana delivery, cannabis delivery zones, THC delivery Minnesota'
    );

    // Open Graph tags for social sharing
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Cannabis Delivery Areas Minnesota | DankDeals MN');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute(
      'content',
      'Fast, reliable cannabis delivery across Minnesota. Licensed marijuana delivery service with same-day delivery.'
    );
  }, []);

  const deliveryZones = [
    {
      name: 'Minneapolis Metro',
      areas: ['Downtown Minneapolis', 'Uptown', 'Northeast Minneapolis', 'South Minneapolis'],
      fee: '$5.00',
      time: '30-60 minutes',
      minimum: '$50',
    },
    {
      name: 'St. Paul Area',
      areas: ['Downtown St. Paul', 'Highland Park', 'Grand Avenue', 'Macalester-Groveland'],
      fee: '$5.00',
      time: '30-60 minutes',
      minimum: '$50',
    },
    {
      name: 'First Ring Suburbs',
      areas: ['Bloomington', 'Edina', 'Minnetonka', 'Roseville', 'Maplewood'],
      fee: '$7.50',
      time: '45-90 minutes',
      minimum: '$75',
    },
    {
      name: 'Extended Metro',
      areas: ['Plymouth', 'Burnsville', 'Woodbury', 'Coon Rapids', 'Eagan'],
      fee: '$10.00',
      time: '60-120 minutes',
      minimum: '$100',
    },
  ];

  const deliveryBenefits = [
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: 'Licensed & Legal',
      description:
        'Fully licensed cannabis delivery service operating in compliance with Minnesota state laws',
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: 'Same-Day Delivery',
      description: 'Fast delivery service with most orders delivered within 1-2 hours of placement',
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      title: 'Wide Coverage Area',
      description:
        'Serving Minneapolis, St. Paul, and surrounding metropolitan areas throughout Minnesota',
    },
    {
      icon: <Phone className="h-6 w-6 text-primary" />,
      title: 'Real-Time Tracking',
      description:
        'Track your cannabis delivery in real-time with SMS updates and delivery notifications',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Delivery Areas" />

      {/* Hero Section */}
      <div className="bg-gradient-hero text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Cannabis Delivery Across Minnesota
          </h1>
          <p className="text-xl md:text-2xl mb-6 text-white/90">
            Fast, reliable marijuana delivery to Minneapolis, St. Paul & surrounding areas
          </p>
          <Badge
            variant="secondary"
            className="bg-primary text-primary-foreground text-lg px-4 py-2"
          >
            Licensed Minnesota Cannabis Delivery
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Delivery Benefits */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Why Choose Our Cannabis Delivery Service?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {deliveryBenefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">{benefit.icon}</div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Delivery Zones */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Minnesota Cannabis Delivery Zones
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            We deliver premium cannabis products throughout the Minneapolis-St. Paul metropolitan
            area. Check if your location is in our delivery zone and view delivery fees below.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deliveryZones.map((zone, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    {zone.name}
                  </CardTitle>
                  <CardDescription className="text-base">{zone.areas.join(' • ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">Delivery Fee</span>
                      </div>
                      <p className="text-muted-foreground">{zone.fee}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">Delivery Time</span>
                      </div>
                      <p className="text-muted-foreground">{zone.time}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">Minimum Order</span>
                      </div>
                      <p className="text-muted-foreground">{zone.minimum}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Delivery Information */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Cannabis Delivery Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Delivery Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Monday - Thursday:</strong> 10:00 AM - 9:00
                    PM
                  </p>
                  <p>
                    <strong className="text-foreground">Friday - Saturday:</strong> 10:00 AM - 10:00
                    PM
                  </p>
                  <p>
                    <strong className="text-foreground">Sunday:</strong> 11:00 AM - 8:00 PM
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Delivery Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Must be 21+ with valid government-issued ID</p>
                  <p>• Delivery address must match ID address</p>
                  <p>• Cash, debit, or credit card payments accepted</p>
                  <p>• Someone 21+ must be present to receive delivery</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Service Areas SEO Content */}
        <section className="mb-12 bg-muted/30 rounded-lg p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Serving Minnesota's Cannabis Community
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-4">
              Our licensed cannabis delivery service proudly serves customers throughout the
              Minneapolis-St. Paul metropolitan area with fast, reliable marijuana delivery. Whether
              you're in downtown Minneapolis, the historic neighborhoods of St. Paul, or the
              surrounding suburbs, we bring premium cannabis products directly to your door.
            </p>
            <p className="mb-4">
              As a fully licensed Minnesota cannabis retailer, we specialize in same-day delivery of
              flower, edibles, concentrates, and pre-rolls throughout our service area. Our
              professional delivery team ensures discreet, secure transportation of all cannabis
              products in compliance with state regulations.
            </p>
            <p>
              Experience the convenience of legal cannabis delivery in Minnesota. Browse our
              extensive selection of THC and CBD products, place your order online, and have your
              marijuana delivered safely to your location within hours.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Questions About Delivery?</CardTitle>
              <CardDescription className="text-lg">
                Contact our customer service team for assistance with delivery areas, timing, or
                special delivery requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <a
                href="tel:763-247-5378"
                className="flex items-center justify-center gap-2 text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Phone className="h-6 w-6" />
                763-247-5378
              </a>
              <p className="text-muted-foreground">
                Call or text to place orders and check delivery status
              </p>
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                Available 7 Days a Week
              </Badge>
            </CardContent>
          </Card>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
