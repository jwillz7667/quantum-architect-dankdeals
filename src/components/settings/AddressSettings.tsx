/**
 * Address Settings Component
 *
 * Manages user's delivery addresses:
 * - View all saved addresses
 * - Add new addresses
 * - Edit existing addresses
 * - Delete addresses
 * - Set default address
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, MapPin, Pencil, Trash2, Star } from 'lucide-react';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
  type Address,
} from '@/hooks/useAddresses';
import AddressForm from './AddressForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AddressSettings() {
  const { data: addresses = [], isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const handleSetDefault = (addressId: string) => {
    void setDefaultAddress.mutateAsync(addressId);
  };

  const handleDelete = () => {
    if (!deletingAddressId) return;
    void deleteAddress.mutateAsync(deletingAddressId);
    setDeletingAddressId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show form if adding or editing
  if (showAddForm || editingAddress) {
    return (
      <AddressForm
        address={editingAddress}
        onSuccess={() => {
          setShowAddForm(false);
          setEditingAddress(null);
        }}
        onCancel={() => {
          setShowAddForm(false);
          setEditingAddress(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">Saved Addresses</h2>
          <p className="text-sm text-muted-foreground">
            Manage your delivery addresses for faster checkout
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No saved addresses</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first delivery address to make checkout faster
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative rounded-lg border p-4 transition-colors ${
                address.is_default ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              {/* Default Badge */}
              {address.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    <Star className="h-3 w-3 fill-current" />
                    Default
                  </span>
                </div>
              )}

              {/* Address Label */}
              {address.label && (
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {address.label}
                </div>
              )}

              {/* Address Details */}
              <div className="space-y-1 mb-3">
                <p className="font-medium">
                  {address.first_name} {address.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.street_address}
                  {address.apartment && `, ${address.apartment}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} {address.zip_code}
                </p>
                {address.phone && (
                  <p className="text-sm text-muted-foreground">{formatPhone(address.phone)}</p>
                )}
                {address.delivery_instructions && (
                  <p className="text-sm text-muted-foreground italic mt-2">
                    "{address.delivery_instructions}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={setDefaultAddress.isPending}
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5" />
                    Set as Default
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditingAddress(address)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingAddressId(address.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingAddressId} onOpenChange={() => setDeletingAddressId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This address will be permanently deleted from your
              account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAddressId(null)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive" disabled={deleteAddress.isPending}>
              {deleteAddress.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Format phone number for display
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}
