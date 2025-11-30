import { useMemo, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Clock, Leaf, Mail, Phone, Shield, Sparkles, CheckCircle, Flame } from '@/lib/icons';
import { submitLaunchWaitlist, type LaunchWaitlistInterest } from '@/services/waitlist';
import { cn } from '@/lib/utils';

const interestOptions: Array<{
  value: LaunchWaitlistInterest;
  title: string;
  detail: string;
}> = [
  {
    value: 'grand_opening',
    title: 'Grand Opening Radar',
    detail: 'Get the hour-by-hour update when doors open and the first drop hits.',
  },
  {
    value: 'beta',
    title: 'Beta Invite',
    detail: 'Test the concierge experience early and shape the flow before the crowd arrives.',
  },
  {
    value: 'vip_access',
    title: 'VIP Drops',
    detail: 'First dibs on limited runs and member-only bundles.',
  },
];

const heroHighlights = [
  {
    icon: Sparkles,
    title: 'Crafted for Minnesota',
    body: 'Curated catalog and delivery built for the Twin Cities scene.',
  },
  {
    icon: Clock,
    title: 'Precise launch alerts',
    body: 'We will text/email the exact moment we flip the switch.',
  },
  {
    icon: Shield,
    title: 'Age-verified + discreet',
    body: '21+ only with verified delivery, private packaging, and real humans on support.',
  },
];

const timeline = [
  {
    title: 'Save your spot',
    body: 'Tell us how to reach you and whether you want opening alerts or beta access.',
  },
  {
    title: 'Beta wave',
    body: 'We invite early insiders to stress-test the experience and unlock perks.',
  },
  {
    title: 'Grand opening',
    body: 'Get the day-one schedule, limited launch bundles, and local-only drops.',
  },
];

const ComingSoon = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    notes: '',
    interest: 'grand_opening' as LaunchWaitlistInterest,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const heroSubtitle = useMemo(
    () =>
      'DankDeals is gearing up for its grand opening. Step onto the launch list for early intel, beta invites, and day-one drops.',
    []
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.email && !formData.phone) {
      toast({
        title: 'Add an email or phone',
        description: 'We need one way to notify you about the launch.',
        variant: 'destructive',
      });
      return;
    }

    void submitWaitlistRequest();
  };

  const submitWaitlistRequest = async () => {
    setSubmitting(true);
    setSubmittedMessage(null);

    try {
      const response = await submitLaunchWaitlist({
        ...formData,
        source: 'coming-soon-page',
        path: typeof window !== 'undefined' ? window.location.pathname : '/coming-soon',
      });

      setSubmittedMessage(response.message || 'You are on the list. We will be in touch soon.');
      toast({
        title: 'You are on the list',
        description: response.message || 'We will share the opening timeline soon.',
      });
    } catch (error) {
      toast({
        title: 'Could not save your request',
        description: error instanceof Error ? error.message : 'Please try again in a few moments.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0d11] text-foreground">
      <SEOHead
        title="DankDeals — Coming Soon"
        description="Join the DankDeals launch list for grand opening alerts, beta invites, and early drops."
        url="https://dankdealsmn.com/"
      />

      {/* Layered background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-[#6dd400]/30 via-[#6dd400]/10 to-transparent blur-[120px]" />
        <div className="absolute -right-10 top-1/3 h-96 w-96 rounded-full bg-gradient-to-br from-[#1f2a1b]/70 via-[#0f1115] to-transparent blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(109,212,0,0.12),transparent_55%)] blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 md:px-6 md:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" />
              Launching soon in Minnesota
            </div>
            <div className="flex items-center gap-4">
              <img
                src="/logos/Dankdeals-logo-new.svg"
                alt="DankDeals"
                className="h-12 w-auto drop-shadow"
              />
              <div className="rounded-full border border-card/70 bg-card/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                Cannabis delivery for 21+
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Something vibrant is rolling in.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{heroSubtitle}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg" variant="premium">
                <a href="#waitlist">Join the launch list</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:support@dankdealsmn.com">Talk to us</a>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                Zero spam — just launch updates.
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {heroHighlights.map((item) => (
                <Card
                  key={item.title}
                  className="border-border/50 bg-card/70 backdrop-blur shadow-elevated"
                >
                  <CardContent className="space-y-3 p-5">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-primary/20 bg-card/70 shadow-elevated backdrop-blur">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-primary">Insider list</p>
                  <h2 className="text-2xl font-semibold text-foreground">Early perks</h2>
                </div>
                <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  Limited spots
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  Beta delivery slots and concierge onboarding.
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Real-time opening schedule and local-only deals.
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Verified 21+ deliveries with discreet packaging.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-gradient-to-br from-card/90 via-card to-card/70 p-4 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Beta</p>
                  <p className="text-xl font-semibold text-foreground">Invites sent weekly</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Launch window
                  </p>
                  <p className="text-xl font-semibold text-foreground">Spring / Summer</p>
                </div>
              </div>
              <Button asChild className="w-full" variant="premium" size="lg">
                <a href="#waitlist">Secure my spot</a>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section
          id="waitlist"
          className="grid gap-8 rounded-3xl border border-border/40 bg-card/70 p-6 shadow-elevated backdrop-blur lg:grid-cols-[1fr_0.9fr]"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.15em] text-primary">Stay in the loop</p>
              <h2 className="text-3xl font-bold text-foreground">Join the launch list</h2>
              <p className="text-muted-foreground">
                Leave your best contact and tell us how you want to plug in. We only email/text for
                meaningful updates.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Alex"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Minneapolis"
                    value={formData.city}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>What do you want first?</Label>
                <div className="grid gap-3 md:grid-cols-3">
                  {interestOptions.map((option) => {
                    const isActive = formData.interest === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, interest: option.value }))}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-all duration-200',
                          isActive
                            ? 'border-primary bg-primary/10 shadow-glow'
                            : 'border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card/80'
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">{option.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{option.detail}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Anything else?</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Share timing constraints, how you want to help test, or anything we should know."
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-muted/10 p-4 text-sm text-muted-foreground">
                <div className="flex flex-1 items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-primary" />
                  <p>
                    We only contact you about launch timing, beta invites, and early deals.
                    Unsubscribe anytime.
                  </p>
                </div>
                {submittedMessage && (
                  <div className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary md:block">
                    Saved
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" size="lg" variant="premium" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Notify me'}
                </Button>
                {submittedMessage ? (
                  <p className="text-sm text-primary">{submittedMessage}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Expect 1-2 messages max until opening.
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-5 rounded-2xl border border-primary/15 bg-gradient-to-b from-card/90 via-[#111417]/95 to-card/80 p-5 shadow-card">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
              <Leaf className="h-4 w-4" />
              What to expect
            </div>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground shadow-inner">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Grand opening promise
              </div>
              <p className="mt-2 text-muted-foreground">
                We will notify insiders first, drop limited bundles in waves, and keep communication
                tight so you know exactly when to place that first order.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ComingSoon;
