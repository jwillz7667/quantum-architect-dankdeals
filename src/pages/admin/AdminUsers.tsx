import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, Shield, CheckCircle, XCircle, Mail, Phone, Calendar, MapPin, Users, Activity, UserCheck, UserX, ShoppingBag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

interface ProfileWithOrderCount extends ProfileRow {
  order_count?: number;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

interface DeliveryAddress {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  [key: string]: string | undefined;
}

const roleOptions = ['customer', 'admin', 'vendor', 'driver'];

export function AdminUsers() {
  const { checkPermission } = useAdminAuth();
  const [users, setUsers] = useState<ProfileWithOrderCount[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderRow[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (checkPermission('manage_users')) {
      fetchUsers();
    }
  }, [checkPermission]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with order count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          orders (count)
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Attempt to fetch auth users (may fail due to permissions)
      try {
        const { data: { users: authUsersList }, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authUsersList) {
          setAuthUsers(authUsersList.map(u => ({
            id: u.id,
            email: u.email || '',
            created_at: u.created_at || new Date().toISOString()
          })));
        }
      } catch (authErr) {
        console.warn('Could not fetch auth users:', authErr);
        // Continue without auth users - we'll fall back to profile data
      }

      // Transform the data to include order count
      const transformedUsers = profiles?.map(profile => {
        const orderData = profile.orders as unknown as { count: number }[];
        return {
          ...profile,
          order_count: orderData?.[0]?.count || 0
        };
      }) || [];

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const getAuthEmail = (userId: string): string => {
    const authUser = authUsers.find(u => u.id === userId);
    return authUser?.email || '';
  };

  const suspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: true })
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchUsers();
    } catch (err) {
      console.error('Error suspending user:', err);
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    }
  };

  const activateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: false })
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchUsers();
    } catch (err) {
      console.error('Error activating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAuthEmail(user.user_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'active') {
      matchesFilter = !user.is_suspended;
    } else if (filterStatus === 'suspended') {
      matchesFilter = user.is_suspended === true;
    }
    
    return matchesSearch && matchesFilter;
  });

  const viewUserDetails = async (user: ProfileRow) => {
    setSelectedUser(user);
    setDetailsOpen(true);

    // Fetch user's order history
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setOrderHistory(data);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.is_suspended).length;
    const suspendedUsers = users.filter(u => u.is_suspended).length;

    return { totalUsers, activeUsers, suspendedUsers };
  };

  const stats = getUserStats();

  const parseDeliveryAddress = (addressData: Json | null): DeliveryAddress => {
    if (!addressData) return {};
    if (typeof addressData === 'string') {
      try {
        return JSON.parse(addressData) as DeliveryAddress;
      } catch {
        return { address: addressData };
      }
    }
    return addressData as DeliveryAddress;
  };

  if (!checkPermission('manage_users')) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to manage users.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Users who can place orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspendedUsers}</div>
            <p className="text-xs text-muted-foreground">Accounts temporarily disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="suspended">Suspended Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const email = user.email || getAuthEmail(user.user_id);
                  const name = user.first_name || user.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'Unknown User';
                  
                  return (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {email}
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          {user.order_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.is_suspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => activateUser(user.user_id)}
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => suspendUser(user.user_id)}
                          >
                            Suspend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              User Details - {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogTitle>
            <DialogDescription>
              Member since {selectedUser && format(new Date(selectedUser.created_at), 'MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-1">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="orders">Order History</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {parseDeliveryAddress(selectedUser.delivery_address)?.address || 'No address on file'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Last sign in: {selectedUser.last_sign_in_at 
                            ? format(new Date(selectedUser.last_sign_in_at), 'PPpp')
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="orders" className="space-y-4">
                    {orderHistory.length > 0 ? (
                      <div className="space-y-2">
                        {orderHistory.map((order) => (
                          <div key={order.id} className="flex justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">Order #{order.order_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                              <Badge variant="outline" className="text-xs">
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">No orders found</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="activity" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm">Total Orders</span>
                        <span className="font-medium">{orderHistory.length}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm">Total Spent</span>
                        <span className="font-medium">
                          {formatCurrency(orderHistory.reduce((sum, order) => sum + order.total_amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm">Average Order Value</span>
                        <span className="font-medium">
                          {orderHistory.length > 0 
                            ? formatCurrency(orderHistory.reduce((sum, order) => sum + order.total_amount, 0) / orderHistory.length)
                            : '$0.00'}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminUsers
