import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AdminProductForm from '@/pages/admin/components/AdminProductForm';
import { useAdminProduct, useAdminProductMutations } from '@/hooks/admin/useAdminProducts';

const AdminProductEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: product, isLoading, error } = useAdminProduct(id, isEditing);
  const { upsert } = useAdminProductMutations();

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
    await upsert.mutateAsync(payload);
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
