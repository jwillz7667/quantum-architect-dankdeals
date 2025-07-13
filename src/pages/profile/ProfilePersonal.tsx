import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User, Mail, CheckCircle, Calendar } from 'lucide-react';

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
}

export default function ProfilePersonal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, date_of_birth')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
        } else if (data) {
          setProfile({
            first_name: (data.first_name ?? '') as string,
            last_name: (data.last_name ?? '') as string,
            phone: (data.phone ?? '') as string,
            date_of_birth: (data.date_of_birth ?? '') as string,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Validate date of birth if provided
      if (profile.date_of_birth) {
        const dob = new Date(profile.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        
        if (age < 21) {
          toast({
            title: 'Age Requirement',
            description: 'You must be 21 years or older to use this service.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      }

      const updateData: any = {
        user_id: user.id,
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone.trim(),
        updated_at: new Date().toISOString(),
      };

      // Only include date_of_birth if it's provided
      if (profile.date_of_birth) {
        updateData.date_of_birth = profile.date_of_birth;
        updateData.age_verified = true;
        updateData.age_verified_at = new Date().toISOString();
      }

      const { error } = await supabase.from('profiles').upsert(updateData);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your personal information has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    void handleSave();
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Personal Information" />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Personal Information</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="w-5 h-5" />
                  Email Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input value={user.email || ''} disabled className="bg-muted" />
                  <p className="text-sm text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={profile.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={profile.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(612) 555-0123"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Used for delivery notifications and order updates
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">
                    Date of Birth
                    <span className="text-xs text-muted-foreground ml-2">(Required for age verification)</span>
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={profile.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 21)).toISOString().split('T')[0]}
                  />
                  <p className="text-sm text-muted-foreground">
                    You must be 21+ years old. This will be verified at delivery.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ID Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  Age Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.date_of_birth ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">Age verified for 21+ requirement</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Please provide your date of birth to complete age verification
                    </p>
                    <Alert className="border-warning bg-warning/10">
                      <AlertDescription className="text-sm">
                        Age verification is required to place orders. Your ID will be checked at delivery.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="space-y-3">
              <Button onClick={handleSaveClick} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
