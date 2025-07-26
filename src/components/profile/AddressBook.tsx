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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Edit, Trash2, Star, Home, Loader2, Save } from 'lucide-react';

const addressSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  street_address: z.string().min(1, 'Street address is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().min(5, 'Valid ZIP code is required'),
  phone: z.string().optional(),
  delivery_instructions: z.string().optional(),
  is_default: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  user_id: string;
  type: 'delivery' | 'billing';
  first_name: string;
  last_name: string;
  street_address: string;
  apartment: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  delivery_instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      state: 'MN', // Default to Minnesota
      is_default: false,
    },
  });

  const isDefault = watch('is_default');

  const fetchAddresses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading addresses',
        description: 'Unable to load your saved addresses. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      void fetchAddresses();
    }
  }, [user, fetchAddresses]);

  const onSubmit = async (data: AddressFormData) => {
    if (!user) return;

    setSaving(true);
    try {
      // If setting as default, unset other defaults first
      if (data.is_default && !editingAddress?.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const addressData = {
        ...data,
        user_id: user.id,
        type: 'delivery' as const,
        apartment: data.apartment || null,
        phone: data.phone || null,
        delivery_instructions: data.delivery_instructions || null,
      };

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id);

        if (error) throw error;

        toast({
          title: 'Address updated',
          description: 'Your address has been updated successfully.',
        });
      } else {
        // Create new address
        const { error } = await supabase.from('addresses').insert([addressData]);

        if (error) throw error;

        toast({
          title: 'Address added',
          description: 'Your new address has been saved successfully.',
        });
      }

      setIsDialogOpen(false);
      setEditingAddress(null);
      reset();
      void fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Unable to save your address. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    reset({
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
    setIsDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', addressId);

      if (error) throw error;

      toast({
        title: 'Address deleted',
        description: 'The address has been removed from your account.',
      });

      void fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Unable to delete the address. Please try again.',
      });
    }
  };

  const setAsDefault = async (addressId: string) => {
    try {
      // Unset all defaults first
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);

      // Set new default
      await supabase.from('addresses').update({ is_default: true }).eq('id', addressId);

      toast({
        title: 'Default address updated',
        description: 'Your default delivery address has been changed.',
      });

      void fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Unable to set default address. Please try again.',
      });
    }
  };

  const openNewAddressDialog = () => {
    setEditingAddress(null);
    reset({
      first_name: '',
      last_name: '',
      street_address: '',
      apartment: '',
      city: '',
      state: 'MN',
      zip_code: '',
      phone: '',
      delivery_instructions: '',
      is_default: addresses.length === 0,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Address Book</span>
              </CardTitle>
              <CardDescription>Manage your delivery and billing addresses</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewAddressDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                  <DialogDescription>
                    {editingAddress
                      ? 'Update your address information below.'
                      : 'Add a new delivery address to your account.'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        {...register('first_name')}
                        placeholder="Enter first name"
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
                        placeholder="Enter last name"
                      />
                      {errors.last_name && (
                        <p className="text-sm text-destructive">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street_address">Street Address</Label>
                    <Input
                      id="street_address"
                      {...register('street_address')}
                      placeholder="Enter street address"
                    />
                    {errors.street_address && (
                      <p className="text-sm text-destructive">{errors.street_address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apartment">Apartment/Suite (Optional)</Label>
                    <Input
                      id="apartment"
                      {...register('apartment')}
                      placeholder="Apt, suite, unit, etc."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register('city')} placeholder="City" />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        {...register('state')}
                        placeholder="State"
                        value="MN"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zip_code">ZIP Code</Label>
                      <Input id="zip_code" {...register('zip_code')} placeholder="ZIP" />
                      {errors.zip_code && (
                        <p className="text-sm text-destructive">{errors.zip_code.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_instructions">Delivery Instructions (Optional)</Label>
                    <Textarea
                      id="delivery_instructions"
                      {...register('delivery_instructions')}
                      placeholder="Special delivery instructions..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={isDefault}
                      onCheckedChange={(checked) => setValue('is_default', checked)}
                    />
                    <Label htmlFor="is_default">Set as default delivery address</Label>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" disabled={saving} className="flex-1">
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editingAddress ? 'Update Address' : 'Save Address'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={saving}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
            <p className="text-muted-foreground mb-4">
              Add your first delivery address to get started
            </p>
            <Button onClick={openNewAddressDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-primary" />
                    {address.is_default && (
                      <Badge variant="default" className="bg-primary/10 text-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => void handleEdit(address)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(address.id)}
                      disabled={address.is_default}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold">
                    {address.first_name} {address.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>{address.street_address}</div>
                    {address.apartment && <div>{address.apartment}</div>}
                    <div>
                      {address.city}, {address.state} {address.zip_code}
                    </div>
                    {address.phone && <div>{address.phone}</div>}
                  </div>
                  {address.delivery_instructions && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>Instructions:</strong> {address.delivery_instructions}
                    </div>
                  )}
                </div>

                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void setAsDefault(address.id)}
                    className="w-full mt-4"
                  >
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
