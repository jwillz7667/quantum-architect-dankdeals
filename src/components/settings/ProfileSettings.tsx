/**
 * Profile Settings Component
 *
 * Allows users to update their profile information including:
 * - First and last name
 * - Phone number
 * - Marketing preferences
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, User, Phone, Mail } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  phone: z
    .string()
    .regex(/^\+?1?\d{10,14}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  marketing_consent: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [phoneInput, setPhoneInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      marketing_consent: false,
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        marketing_consent: profile.marketing_consent || false,
      });
      setPhoneInput(formatPhoneNumber(profile.phone || ''));
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    await updateProfile.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || null,
      marketing_consent: data.marketing_consent,
    });
  };

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const formatted = formatPhoneNumber(value);
    setPhoneInput(formatted);
    setValue('phone', value, { shouldValidate: true, shouldDirty: true });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Personal Information</h2>
        <p className="text-sm text-muted-foreground">
          Update your personal details and contact information
        </p>
      </div>

      <Separator />

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
        className="space-y-6"
      >
        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={profile?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email is managed through your account provider and cannot be changed here
          </p>
        </div>

        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="first_name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            First Name
          </Label>
          <Input
            id="first_name"
            placeholder="John"
            {...register('first_name')}
            className={errors.first_name ? 'border-destructive' : ''}
          />
          {errors.first_name && (
            <p className="text-xs text-destructive">{errors.first_name.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            placeholder="Doe"
            {...register('last_name')}
            className={errors.last_name ? 'border-destructive' : ''}
          />
          {errors.last_name && (
            <p className="text-xs text-destructive">{errors.last_name.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(651) 555-1234"
            value={phoneInput}
            onChange={handlePhoneChange}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          <p className="text-xs text-muted-foreground">
            Used for delivery coordination and order updates
          </p>
        </div>

        <Separator />

        {/* Marketing Preferences */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium mb-1">Preferences</h3>
            <p className="text-sm text-muted-foreground">Manage your communication preferences</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="marketing_consent" className="text-base">
                Marketing Communications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new products and special offers
              </p>
            </div>
            <Switch
              id="marketing_consent"
              checked={watch('marketing_consent')}
              onCheckedChange={(checked) =>
                setValue('marketing_consent', checked, { shouldDirty: true })
              }
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={!isDirty || updateProfile.isPending} className="min-w-32">
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  if (cleaned.length <= 10)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;

  // Handle 11-digit numbers (with country code)
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
}
