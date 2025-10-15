import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Terms of Service" />

      <div className="max-w-md mx-auto px-4 pt-6 pb-28 md:pb-12">
        <div className="prose prose-sm max-w-none">
          <h2 className="text-xl font-bold text-foreground mb-6">Terms of Service</h2>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Acceptance of Terms</h3>
              <p>
                By accessing and using DankDealsMN.com, you accept and agree to be bound by the
                terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Age Restriction</h3>
              <p>
                You must be at least 21 years of age to use our services. By using our website, you
                represent and warrant that you are at least 21 years old.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Product Information</h3>
              <p>
                We strive to provide accurate product information, but we do not warrant that
                product descriptions or other content is accurate, complete, reliable, or
                error-free.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Delivery Policy</h3>
              <p>
                Delivery is available within our service areas only. You must be present to receive
                delivery and provide valid identification proving you are 21 years or older.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Prohibited Uses</h3>
              <p>
                You may not use our services for any unlawful purpose or to solicit others to
                perform unlawful acts. You may not violate any local, state, or federal laws.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Limitation of Liability
              </h3>
              <p>
                In no case shall DankDealsMN.com be liable for any direct, indirect, special,
                incidental, or consequential damages arising from the use of our services.
              </p>
            </section>

            <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
