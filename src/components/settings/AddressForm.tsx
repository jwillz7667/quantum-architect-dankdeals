/**
 * Address Form Component
 *
 * Form for creating or editing delivery addresses
 */

import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, X } from 'lucide-react';
import {
  useCreateAddress,
  useUpdateAddress,
  type Address,
  type CreateAddressData,
} from '@/hooks/useAddresses';

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  street_address: z.string().min(1, 'Street address is required').max(200),
  apartment: z.string().max(50).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().length(2, 'State must be 2 characters').default('MN'),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  phone: z
    .string()
    .regex(/^\+?1?\d{10,14}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  delivery_instructions: z.string().max(500).optional(),
  is_default: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  address?: Address | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const isEditing = !!address;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema) as Resolver<AddressFormValues>,
    defaultValues: {
      label: '',
      first_name: '',
      last_name: '',
      street_address: '',
      apartment: '',
      city: '',
      state: 'MN',
      zip_code: '',
      phone: '',
      delivery_instructions: '',
      is_default: false,
    },
  });

  // Load address data when editing
  useEffect(() => {
    if (address) {
      reset({
        label: address.label || '',
        first_name: address.first_name,
        last_name: address.last_name,
        street_address: address.street_address,
        apartment: address.apartment || '',
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        phone: address.phone || '',
        delivery_instructions: address.delivery_instructions || '',
        is_default: address.is_default,
      });
    }
  }, [address, reset]);

  const onSubmit = async (data: AddressFormValues) => {
    try {
      // Clean up empty strings to null and remove hyphen from zip
      // Clean up zip code (remove hyphen if present)
      const cleanZip = data.zip_code?.split('-')[0] || data.zip_code;

      const cleanData: CreateAddressData = {
        first_name: data.first_name,
        last_name: data.last_name,
        street_address: data.street_address,
        city: data.city,
        state: data.state || 'MN',
        zip_code: cleanZip,
        label: data.label || null,
        apartment: data.apartment || null,
        phone: data.phone || null,
        delivery_instructions: data.delivery_instructions || null,
        is_default: data.is_default,
      };

      if (isEditing && address) {
        await updateAddress.mutateAsync({ id: address.id, ...cleanData });
      } else {
        await createAddress.mutateAsync(cleanData);
      }

      onSuccess();
    } catch (error) {
      console.error('Address save error:', error);
    }
  };

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">
            {isEditing ? 'Edit Address' : 'Add New Address'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Update your delivery address information'
              : 'Add a new delivery address to your account'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
      >
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Address Label (Optional)</Label>
          <Input id="label" placeholder="Home, Work, Mom's House..." {...register('label')} />
          <p className="text-xs text-muted-foreground">
            Give this address a nickname for easy identification
          </p>
        </div>

        {/* Name */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
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
        </div>

        {/* Street Address */}
        <div className="space-y-2">
          <Label htmlFor="street_address">Street Address</Label>
          <Input
            id="street_address"
            placeholder="123 Main St"
            {...register('street_address')}
            className={errors.street_address ? 'border-destructive' : ''}
          />
          {errors.street_address && (
            <p className="text-xs text-destructive">{errors.street_address.message}</p>
          )}
        </div>

        {/* Apartment/Unit */}
        <div className="space-y-2">
          <Label htmlFor="apartment">Apartment, Suite, Unit (Optional)</Label>
          <Input id="apartment" placeholder="Apt 4B" {...register('apartment')} />
        </div>

        {/* City, State, ZIP */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Minneapolis"
              {...register('city')}
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="MN"
              maxLength={2}
              {...register('state')}
              className={errors.state ? 'border-destructive' : ''}
            />
            {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip_code">ZIP Code</Label>
            <Input
              id="zip_code"
              placeholder="55401"
              maxLength={5}
              {...register('zip_code')}
              className={errors.zip_code ? 'border-destructive' : ''}
            />
            {errors.zip_code && (
              <p className="text-xs text-destructive">{errors.zip_code.message}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(651) 555-1234"
            {...register('phone')}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          <p className="text-xs text-muted-foreground">Used by delivery driver to contact you</p>
        </div>

        {/* Delivery Instructions */}
        <div className="space-y-2">
          <Label htmlFor="delivery_instructions">Delivery Instructions (Optional)</Label>
          <Textarea
            id="delivery_instructions"
            rows={3}
            placeholder="Gate code, parking instructions, or other delivery notes..."
            {...register('delivery_instructions')}
          />
          <p className="text-xs text-muted-foreground">
            Help the delivery driver find you more easily
          </p>
        </div>

        <Separator />

        {/* Set as Default */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="is_default" className="text-base">
              Set as Default Address
            </Label>
            <p className="text-sm text-muted-foreground">
              Use this address for future orders by default
            </p>
          </div>
          <Switch
            id="is_default"
            checked={watch('is_default')}
            onCheckedChange={(checked) => setValue('is_default', checked, { shouldDirty: true })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isDirty || isPending} className="min-w-32">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Address' : 'Add Address'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
