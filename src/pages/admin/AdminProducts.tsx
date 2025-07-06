import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Search, Package, Eye, TrendingUp, DollarSign } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];

interface Product extends ProductRow {
  product_variants: ProductVariant[] | null;
}

interface ProductVariant extends ProductVariantRow {
  weight_grams?: number;
  is_active?: boolean;
}

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.enum(['flower', 'edibles', 'concentrates', 'prerolls', 'topicals', 'accessories']),
  thc_content: z.string().optional(),
  cbd_content: z.string().optional(),
  is_active: z.boolean(),
});

const variantSchema = z.object({
  size: z.string().min(1, 'Variant size is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  inventory_count: z.number().min(0).optional(),
  sku: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;
type VariantFormData = z.infer<typeof variantSchema>;

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { toast } = useToast();

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'flower',
      thc_content: '',
      cbd_content: '',
      is_active: true,
    },
  });

  const variantForm = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      size: '',
      price: 0,
      inventory_count: 0,
      sku: '',
    },
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_variants (*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitProduct = async (data: ProductFormData) => {
    try {
      if (selectedProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedProduct.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        // Create new product with default vendor
        const { data: vendors } = await supabase.from('vendors').select('id').limit(1);

        const vendorId = vendors?.[0]?.id || '00000000-0000-0000-0000-000000000000';

        const { error } = await supabase.from('products').insert({
          ...data,
          vendor_id: vendorId,
        });

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      setProductDialogOpen(false);
      productForm.reset();
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive',
      });
    }
  };

  const onSubmitVariant = async (data: VariantFormData) => {
    if (!selectedProduct) return;

    try {
      const variantData = {
        ...data,
        price: Math.round(data.price * 100), // Convert to cents
        product_id: selectedProduct.id,
        sku: data.sku || `${selectedProduct.id}-${data.size}`,
      };

      if (selectedVariant) {
        // Update existing variant
        const { error } = await supabase
          .from('product_variants')
          .update({
            ...variantData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedVariant.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Variant updated successfully',
        });
      } else {
        // Create new variant
        const { error } = await supabase.from('product_variants').insert(variantData);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Variant created successfully',
        });
      }

      setVariantDialogOpen(false);
      variantForm.reset();
      setSelectedVariant(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to save variant',
        variant: 'destructive',
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase.from('product_variants').delete().eq('id', variantId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Variant deleted successfully',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete variant',
        variant: 'destructive',
      });
    }
  };

  const editProduct = (product: Product) => {
    setSelectedProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || '',
      category: product.category as ProductFormData['category'],
      thc_content: product.thc_content || '',
      cbd_content: product.cbd_content || '',
      is_active: product.is_active,
    });
    setProductDialogOpen(true);
  };

  const editVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    variantForm.reset({
      size: variant.size,
      price: variant.price / 100, // Convert from cents
      inventory_count: variant.inventory_count || 0,
      sku: variant.sku,
    });
    setVariantDialogOpen(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedProduct(null);
                productForm.reset();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {selectedProduct ? 'Update product details' : 'Create a new product listing'}
              </DialogDescription>
            </DialogHeader>
            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Blue Dream" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Product description..." {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flower">Flower</SelectItem>
                          <SelectItem value="edibles">Edibles</SelectItem>
                          <SelectItem value="concentrates">Concentrates</SelectItem>
                          <SelectItem value="prerolls">Pre-rolls</SelectItem>
                          <SelectItem value="topicals">Topicals</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productForm.control}
                    name="thc_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>THC Content (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 18.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productForm.control}
                    name="cbd_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CBD Content (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={productForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Product is available for purchase</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProductDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{selectedProduct ? 'Update' : 'Create'} Product</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="flower">Flower</SelectItem>
                <SelectItem value="edibles">Edibles</SelectItem>
                <SelectItem value="concentrates">Concentrates</SelectItem>
                <SelectItem value="prerolls">Pre-rolls</SelectItem>
                <SelectItem value="topicals">Topicals</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>Manage your product catalog and inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                        <span>THC: {product.thc_content}%</span>
                        <span>CBD: {product.cbd_content}%</span>
                      </div>

                      {/* Variants */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Variants</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setSelectedVariant(null);
                              variantForm.reset();
                              setVariantDialogOpen(true);
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Variant
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          {product.product_variants?.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <span className="font-medium">{variant.size}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {formatCurrency(variant.price)} • Stock:{' '}
                                  {variant.inventory_count || 0}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    editVariant(variant);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteVariant(variant.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => editProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedVariant ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
            <DialogDescription>{selectedProduct?.name}</DialogDescription>
          </DialogHeader>
          <Form {...variantForm}>
            <form onSubmit={variantForm.handleSubmit(onSubmitVariant)} className="space-y-4">
              <FormField
                control={variantForm.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant Size</FormLabel>
                    <FormControl>
                      <Input placeholder="1g, 3.5g, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={variantForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={variantForm.control}
                name="inventory_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={variantForm.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setVariantDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedVariant ? 'Update' : 'Create'} Variant</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminProducts;
