import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AdminProductForm from '@/pages/admin/components/AdminProductForm';
import { useAdminProduct, useAdminProductMutations } from '@/hooks/admin/useAdminProducts';

const AdminProductEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: product, isLoading, error } = useAdminProduct(id, isEditing);
  const { upsert } = useAdminProductMutations();

  useEffect(() => {
    // Show message if redirected after creating product
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      toast.info(state.message, {
        description: 'You can now upload product images with the proper product ID.',
        duration: 6000,
      });
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    if (error) {
      // Surface a friendly message and return to list
      navigate('/admin/products', { replace: true });
    }
  }, [error, isEditing, navigate]);

  const handleSubmit = async (payload: Parameters<typeof upsert.mutateAsync>[0]) => {
    const result = await upsert.mutateAsync(payload);
    
    // If creating a new product, redirect to edit page so images can be uploaded with proper product ID
    if (!isEditing && result) {
      // Extract product ID from result
      const productId = typeof result === 'object' && result && 'id' in result 
        ? result.id 
        : payload.product.id;
      
      if (productId) {
        console.log('New product created, redirecting to edit for image upload', { productId });
        navigate(`/admin/products/${productId}`, { 
          replace: true,
          state: { message: 'Product created! Now you can upload images.' }
        });
        return;
      }
    }
    
    navigate('/admin/products');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {isEditing ? 'Edit product' : 'Create product'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Update product details and publish changes instantly.'
              : 'Add a new product and configure its storefront presence.'}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/admin/products')}>
          Back to list
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing && isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <AdminProductForm
              initialProduct={product ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/admin/products')}
              isSubmitting={upsert.isPending}
              submitLabel={isEditing ? 'Update product' : 'Create product'}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProductEditor;
