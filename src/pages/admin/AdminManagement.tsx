import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Loader2, Plus, Shield, User } from 'lucide-react';

interface Admin {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminManagement() {
  const { adminUser, isSuperAdmin } = useAdminAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      logger.error('Error fetching admins', error as Error);
      toast({
        title: 'Error',
        description: 'Failed to load admins',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail) return;

    setIsAddingAdmin(true);
    try {
      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newAdminEmail)
        .single();

      if (userError || !userData) {
        throw new Error('User not found. They must create an account first.');
      }

      // Add to admins table
      const { error: adminError } = await supabase.from('admins').insert({
        user_id: userData.user_id,
        email: newAdminEmail,
        role: newAdminRole,
        created_by: adminUser?.id,
      });

      if (adminError) throw adminError;

      logger.audit('admin_created', adminUser?.id || '', {
        newAdminEmail,
        newAdminRole,
      });

      toast({
        title: 'Success',
        description: `Admin ${newAdminEmail} added successfully`,
      });

      setNewAdminEmail('');
      setDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      logger.error('Error adding admin', error as Error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add admin',
        variant: 'destructive',
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId);

      if (error) throw error;

      logger.audit('admin_status_changed', adminUser?.id || '', {
        adminId,
        newStatus: !currentStatus,
      });

      toast({
        title: 'Success',
        description: `Admin ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });

      fetchAdmins();
    } catch (error) {
      logger.error('Error updating admin status', error as Error);
      toast({
        title: 'Error',
        description: 'Failed to update admin status',
        variant: 'destructive',
      });
    }
  };

  const updateAdminRole = async (adminId: string, newRole: 'admin' | 'super_admin') => {
    try {
      const { error } = await supabase.from('admins').update({ role: newRole }).eq('id', adminId);

      if (error) throw error;

      logger.audit('admin_role_changed', adminUser?.id || '', {
        adminId,
        newRole,
      });

      toast({
        title: 'Success',
        description: 'Admin role updated successfully',
      });

      fetchAdmins();
    } catch (error) {
      logger.error('Error updating admin role', error as Error);
      toast({
        title: 'Error',
        description: 'Failed to update admin role',
        variant: 'destructive',
      });
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only super administrators can access admin management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
          <p className="text-muted-foreground">Manage administrators and their permissions</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Administrator</DialogTitle>
              <DialogDescription>
                Add a new administrator to the system. They must have an existing account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newAdminRole}
                  onValueChange={(value: 'admin' | 'super_admin') => setNewAdminRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addAdmin} disabled={isAddingAdmin || !newAdminEmail}>
                {isAddingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Administrators</CardTitle>
          <CardDescription>
            {admins.length} administrator{admins.length !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {admin.role === 'super_admin' ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      {admin.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={admin.role}
                      onValueChange={(value: 'admin' | 'super_admin') =>
                        updateAdminRole(admin.id, value)
                      }
                      disabled={admin.user_id === adminUser?.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Switch
                      checked={admin.is_active}
                      onCheckedChange={() => toggleAdminStatus(admin.id, admin.is_active)}
                      disabled={admin.user_id === adminUser?.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminManagement;
