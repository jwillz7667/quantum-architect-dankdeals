import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Loader2, Save, User, Mail, Phone, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  marketing_consent: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type UserProfile = Database['public']['Tables']['profiles']['Row'];

export function ProfileInfo() {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const marketingConsent = watch('marketing_consent');

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const response = await supabase.from('profiles').select('*').eq('id', user.id).single();

      const data = response.data as UserProfile | null;
      const error = response.error;

      if (!data && !error) {
        throw new Error('No response data received');
      }

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const newProfile = {
            id: user.id,
            email: user.email,
            first_name: (user.user_metadata?.['first_name'] as string) || '',
            last_name: (user.user_metadata?.['last_name'] as string) || '',
            phone: user.phone || '',
            marketing_consent: false,
          };

          const createResponse = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createResponse.error) {
            throw new Error(createResponse.error.message || 'Failed to create profile');
          }

          const createdProfile = createResponse.data as UserProfile;
          if (!createdProfile) {
            throw new Error('Failed to create profile');
          }

          setProfile(createdProfile);
          reset({
            first_name: createdProfile.first_name ?? '',
            last_name: createdProfile.last_name ?? '',
            email: createdProfile.email ?? '',
            phone: createdProfile.phone ?? '',
            date_of_birth: createdProfile.date_of_birth ?? '',
            marketing_consent: createdProfile.marketing_consent ?? false,
          });
        } else {
          throw new Error(error.message || 'Unknown error occurred');
        }
      } else {
        const profileData = data as UserProfile;
        if (!profileData) {
          throw new Error('No profile data found');
        }
        setProfile(profileData);
        reset({
          first_name: profileData.first_name ?? '',
          last_name: profileData.last_name ?? '',
          email: profileData.email ?? '',
          phone: profileData.phone ?? '',
          date_of_birth: profileData.date_of_birth ?? '',
          marketing_consent: profileData.marketing_consent ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading profile',
        description: 'Unable to load your profile information. Please try again.',
      });
    }
  }, [user, reset, toast]);

  useEffect(() => {
    if (user) {
      void fetchProfile();
    }
  }, [user, fetchProfile]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      const updateResponse = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          date_of_birth: data.date_of_birth || null,
          marketing_consent: data.marketing_consent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateResponse.error) {
        throw updateResponse.error;
      }

      const updatedProfile = updateResponse.data as UserProfile;
      if (!updatedProfile) {
        throw new Error('Failed to update profile');
      }

      // Update auth user email if changed
      if (data.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (authError) {
          throw authError;
        }
      }

      // Update local profile state with the returned data from database
      setProfile(updatedProfile);

      // Reset form with the updated profile data to ensure consistency
      reset({
        first_name: updatedProfile.first_name ?? '',
        last_name: updatedProfile.last_name ?? '',
        email: updatedProfile.email ?? '',
        phone: updatedProfile.phone ?? '',
        date_of_birth: updatedProfile.date_of_birth ?? '',
        marketing_consent: updatedProfile.marketing_consent ?? false,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been saved successfully.',
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Unable to save your profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        marketing_consent: profile.marketing_consent || false,
      });
    }
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Account Status</CardTitle>
            </div>
            <div className="flex space-x-2">
              {profile.age_verified ? (
                <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Age Verified
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Verification Required
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Mail className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Email Status</div>
              <div className="text-xs text-muted-foreground">
                {user?.email_confirmed_at ? 'Verified' : 'Pending Verification'}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Phone className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Phone Status</div>
              <div className="text-xs text-muted-foreground">
                {profile.phone ? 'Added' : 'Not Added'}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Member Since</div>
              <div className="text-xs text-muted-foreground">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="shrink-0">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  disabled={!isEditing}
                  placeholder="Enter your first name"
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  disabled={!isEditing}
                  placeholder="Enter your last name"
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={!isEditing}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
                disabled={!isEditing}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="marketing_consent"
                checked={marketingConsent}
                onCheckedChange={(checked) => setValue('marketing_consent', checked)}
                disabled={!isEditing}
              />
              <Label htmlFor="marketing_consent" className="text-sm">
                I want to receive marketing emails and promotional offers
              </Label>
            </div>

            {isEditing && (
              <div className="flex space-x-2 pt-4">
                <Button type="submit" disabled={isLoading || !isDirty} className="flex-1">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
