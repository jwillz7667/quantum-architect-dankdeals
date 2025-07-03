import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { IDVerificationAdmin } from "@/components/IDVerificationAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();

  // In a real app, you'd check if the user has admin privileges
  // For now, we'll allow any authenticated user to access this (for testing)
  // TODO: Implement proper admin role checking
  
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Admin Panel" />
        
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be signed in to access the admin panel.
            </AlertDescription>
          </Alert>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Admin Panel" />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <IDVerificationAdmin />
      </div>
      
      <BottomNav />
    </div>
  );
} 