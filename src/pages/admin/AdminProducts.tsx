import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminProductMutations, useAdminProducts } from '@/hooks/admin/useAdminProducts';
import type { AdminProductStatusFilter } from '@/lib/admin/products';

const PAGE_SIZE = 20;

const AdminProducts = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<AdminProductStatusFilter>('all');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const filters = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search: debouncedSearch, status }),
    [page, debouncedSearch, status]
  );

  const productQuery = useAdminProducts(filters);
  const { remove, toggleStatus } = useAdminProductMutations();

  const products = productQuery.data?.products ?? [];
  const total = productQuery.data?.total ?? 0;
  const pageSize = productQuery.data?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      'Archive this product? It will be hidden from the storefront.'
    );
    if (!confirmed) return;

    remove.mutate({ id });
  };

  const handleToggle = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    toggleStatus.mutate(product);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Product catalog</h2>
          <p className="text-sm text-muted-foreground">
            Manage product listings, inventory, and publish updates to the storefront.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">Add product</Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search products"
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setPage(1);
              setStatus(value as AdminProductStatusFilter);
            }}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Results</CardTitle>
          {productQuery.isFetching && (
            <span className="text-xs text-muted-foreground">Refreshing…</span>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {productQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="w-[30%] py-2">Name</th>
                  <th className="w-[12%] py-2">Category</th>
                  <th className="w-[10%] py-2">Variants</th>
                  <th className="w-[10%] py-2">Status</th>
                  <th className="w-[15%] py-2">Updated</th>
                  <th className="w-[23%] py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <span className="truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 capitalize">{product.category}</td>
                    <td className="py-3 text-muted-foreground">{product.variants?.length ?? 0}</td>
                    <td className="py-3">
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {product.updated_at ? new Date(product.updated_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(product.id)}
                          disabled={toggleStatus.isPending}
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          disabled={remove.isPending}
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No products found. Try adjusting filters or add a new product.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages} • {total} total products
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
