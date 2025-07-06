import { useEffect, useState, useCallback } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText } from 'lucide-react';
import { AdminActivityLog } from '@/integrations/supabase/types';

const actionColors: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
};

interface AuthUser {
  id: string;
  email: string;
}

export function AdminActivity() {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchActivityLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select(
          `
          *,
          admin:profiles!admin_activity_logs_admin_id_fkey (
            user_id,
            first_name,
            last_name
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch admin emails
      if (data) {
        const adminIds = [...new Set(data.map((log) => log.admin_id))];

        // Try to fetch auth data, but continue if it fails
        let authData: { users: AuthUser[] } | null = null;
        try {
          const authResponse = await supabase.auth.admin.listUsers();
          authData = authResponse.data as { users: AuthUser[] };
        } catch (authError) {
          console.error('Could not fetch auth data:', authError);
        }

        const enrichedData = data.map((log) => {
          const authUser = authData?.users?.find((u) => u.id === log.admin_id);
          return {
            ...log,
            admin: {
              ...log.admin,
              email: authUser?.email || 'Unknown',
            },
          } as AdminActivityLog;
        });

        setActivities(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const filterActivities = useCallback(() => {
    if (!searchTerm) {
      setFilteredActivities(activities);
      return;
    }

    const filtered = activities.filter((activity) => {
      const searchLower = searchTerm.toLowerCase();
      const adminName =
        `${activity.admin.first_name || ''} ${activity.admin.last_name || ''}`.toLowerCase();
      return (
        activity.entity_type?.toLowerCase().includes(searchLower) ||
        false ||
        activity.action.toLowerCase().includes(searchLower) ||
        activity.admin.email.toLowerCase().includes(searchLower) ||
        adminName.includes(searchLower)
      );
    });

    setFilteredActivities(filtered);
  }, [activities, searchTerm]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  useEffect(() => {
    filterActivities();
  }, [filterActivities]);

  const exportLogs = () => {
    const csv = [
      ['Date', 'Admin', 'Action', 'Entity Type', 'Entity ID'].join(','),
      ...filteredActivities.map((log) =>
        [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          `${log.admin.first_name || ''} ${log.admin.last_name || ''} (${log.admin.email})`,
          log.action,
          log.entity_type || 'N/A',
          log.entity_id || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getActionBadge = (action: string) => {
    return <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>{action}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <Button onClick={exportLogs} variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            Track all administrative actions performed in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by admin, action, or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {activity.admin.first_name || ''} {activity.admin.last_name || ''}
                        </p>
                        <p className="text-sm text-muted-foreground">{activity.admin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(activity.action)}</TableCell>
                    <TableCell>
                      {activity.entity_type && (
                        <div>
                          <p className="font-medium capitalize">
                            {activity.entity_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.entity_id || 'N/A'}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.details && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const details = JSON.stringify(activity.details, null, 2);
                            const blob = new Blob([details], { type: 'application/json' });
                            const url = window.URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminActivity;
