import React, { useState } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from '../components/ui/skeleton';
import { Pencil, Trash2 } from 'lucide-react';

const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

type Product = z.infer<typeof productSchema>;

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return z.array(productSchema).parse(data || []);
};

const createProduct = async (newProduct: Omit<Product, 'id'>): Promise<Product> => {
  const result = await supabase.from('products').insert(newProduct).select().single();
  if (result.error) throw result.error;
  return productSchema.parse(result.data);
};

const updateProduct = async (updatedProduct: Product): Promise<Product> => {
  const result = await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id).select().single();
  if (result.error) throw result.error;
  return productSchema.parse(result.data);
};

const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

const ProductsAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 0 });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['productsAdmin'],
    queryFn: fetchProducts,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['productsAdmin'] });
      toast({ title: 'Product added' });
      setIsAddDialogOpen(false);
    },
    onError: () => toast({ variant: 'destructive', title: 'Error adding product' }),
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['productsAdmin'] });
      toast({ title: 'Product updated' });
      setEditingProduct(null);
      setIsEditDialogOpen(false);
    },
    onError: () => toast({ variant: 'destructive', title: 'Error updating product' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['productsAdmin'] });
      toast({ title: 'Product deleted' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Error deleting product' }),
  });

  const handleAdd = () => {
    createMutation.mutate(newProduct);
    setNewProduct({ name: '', price: 0, stock: 0 });
  };

  const handleUpdate = () => {
    if (editingProduct) {
      updateMutation.mutate(editingProduct);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <ProtectedRoute requiresAdmin>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  placeholder="Stock"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                />
                <Button onClick={handleAdd} className="w-full">Add Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen && editingProduct?.id === product.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Product Name"
                              value={editingProduct?.name || ''}
                              onChange={(e) => setEditingProduct(editingProduct ? { ...editingProduct, name: e.target.value } : null)}
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={editingProduct?.price || 0}
                              onChange={(e) => setEditingProduct(editingProduct ? { ...editingProduct, price: parseFloat(e.target.value) || 0 } : null)}
                            />
                            <Input
                              type="number"
                              placeholder="Stock"
                              value={editingProduct?.stock || 0}
                              onChange={(e) => setEditingProduct(editingProduct ? { ...editingProduct, stock: parseInt(e.target.value) || 0 } : null)}
                            />
                            <Button onClick={handleUpdate} className="w-full">Update Product</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ProductsAdmin; 