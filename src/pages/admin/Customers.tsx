import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { z } from 'zod';
import { Input } from '../../components/ui/input';
import { Search } from 'lucide-react';

const customerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  created_at: z.string(),
  order_count: z.number().optional(),
  total_spent: z.number().optional(),
});

type Customer = z.infer<typeof customerSchema>;

const fetchCustomers = async (searchTerm: string): Promise<Customer[]> => {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      created_at,
      orders!left(
        total_amount
      )
    `);

  if (searchTerm) {
    query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Transform data to include order stats
  const customers = (data || []).map((customer: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    orders?: Array<{ total_amount: number }>;
  }) => ({
    id: customer.id,
    email: customer.email,
    full_name: customer.full_name,
    created_at: customer.created_at,
    order_count: customer.orders?.length || 0,
    total_spent: customer.orders?.reduce((sum: number, order) => sum + order.total_amount, 0) || 0,
  }));

  return z.array(customerSchema).parse(customers);
};

const Customers: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customersAdmin', debouncedSearchTerm],
    queryFn: () => fetchCustomers(debouncedSearchTerm),
  });

  if (error) {
    toast({ variant: 'destructive', title: 'Error loading customers' });
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Member Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers?.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.full_name || 'N/A'}</TableCell>
                <TableCell>{customer.order_count}</TableCell>
                <TableCell>${(customer.total_spent || 0).toFixed(2)}</TableCell>
                <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Customers; 