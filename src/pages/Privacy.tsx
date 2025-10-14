import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Privacy Policy" />

      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <div className="prose prose-sm max-w-none">
          <h2 className="text-xl font-bold text-foreground mb-6">Privacy Policy</h2>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Information We Collect</h3>
              <p>
                We collect information you provide directly to us, such as when you create an
                account, make a purchase, or contact us for support. This may include your name,
                email address, phone number, delivery address, and payment information.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                How We Use Your Information
              </h3>
              <p>
                We use the information we collect to provide, maintain, and improve our services,
                process transactions, communicate with you, and comply with legal requirements.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Information Sharing</h3>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may
                share your information with service providers who assist us in operating our
                business, and as required by law.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Data Security</h3>
              <p>
                We implement appropriate security measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us at
                privacy@dankdealsmn.com.
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
