import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";

export default function ProfilePayment() {
  const navigate = useNavigate();
  const [loading] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Payment Methods" />

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/profile')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payment Methods</h2>
            <p className="text-muted-foreground">
              Cash payment required at delivery
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Cash Only Service</AlertTitle>
            <AlertDescription>
              We currently only accept cash payments. Payment is due upon delivery. 
              Please have exact change ready for your driver.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cash on Delivery
              </CardTitle>
              <CardDescription>
                Our only accepted payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How it works:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Place your order online</li>
                    <li>Our driver will text you when they're on the way</li>
                    <li>Meet the driver at your delivery address</li>
                    <li>Pay with cash when you receive your order</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Important reminders:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Please have exact change ready</li>
                    <li>Drivers carry limited change</li>
                    <li>Tips are appreciated but not required</li>
                    <li>You must be 21+ with valid ID</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CreditCard className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Digital Payments Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    We're working on adding digital payment options for your convenience. 
                    Stay tuned for updates!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-center text-muted-foreground">
              Questions about payment? Contact us at{" "}
              <a href="tel:612-555-0420" className="font-medium text-primary hover:underline">
                (612) 555-0420
              </a>
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}