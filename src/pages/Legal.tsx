import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';

export default function Legal() {
  return (
    <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Legal Information" />

      <div className="max-w-md mx-auto px-4 pt-6 pb-28 md:pb-12">
        <div className="prose prose-sm max-w-none">
          <h2 className="text-xl font-bold text-foreground mb-6">Legal Information</h2>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Licensed Cannabis Retailer
              </h3>
              <p>
                DankDealsMN.com operates as a licensed cannabis retailer in the state of Minnesota
                under license number [LICENSE-NUMBER]. We comply with all state and local
                regulations governing cannabis sales and delivery.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">State Compliance</h3>
              <p>
                All products sold through our platform comply with Minnesota state regulations
                regarding THC content, testing requirements, and packaging standards.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Age Verification</h3>
              <p>
                We are required by law to verify the age of all customers. Valid government-issued
                photo identification is required for all deliveries. We do not sell to anyone under
                21.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Consumption Guidelines</h3>
              <p>
                Cannabis products are for adult use only. Do not operate vehicles or machinery after
                consumption. Keep products away from children and pets. Consume responsibly.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Health & Safety Warning
              </h3>
              <p>
                This product has not been analyzed or approved by the FDA. There may be health risks
                associated with consumption of this product. Consult with a physician before use if
                you have any medical conditions.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Regulatory Contact</h3>
              <p>
                For questions about cannabis regulations in Minnesota, contact the Minnesota
                Cannabis Office or visit their official website.
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
