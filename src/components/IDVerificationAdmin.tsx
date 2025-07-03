import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, User, Calendar, FileImage, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface IDSubmission {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  verification_status: string;
  id_verification_data: {
    image_url: string;
    image_path: string;
    submitted_at: string;
    status: string;
    file_size: number;
    file_type: string;
  } | null;
  id_verification_date: string | null;
}

export const IDVerificationAdmin = () => {
  const [submissions, setSubmissions] = useState<IDSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('pending');
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSubmissions = async (status?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, verification_status, id_verification_data, id_verification_date')
        .not('id_verification_data', 'is', null);

      if (status) {
        query = query.eq('verification_status', status);
      }

      const { data, error } = await query.order('id_verification_date', { ascending: false });

      if (error) {
        throw error;
      }

      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Submissions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(currentTab === 'all' ? undefined : currentTab === 'pending' ? 'pending_review' : currentTab);
  }, [currentTab]);

  const updateVerificationStatus = async (profileId: string, status: 'approved' | 'rejected', reason?: string) => {
    if (!user) return;

    setProcessingId(profileId);
    
    try {
      const updateData: any = {
        verification_status: status,
        is_id_verified: status === 'approved',
      };

      // Add review information to verification data
      const submission = submissions.find(s => s.id === profileId);
      if (submission?.id_verification_data) {
        updateData.id_verification_data = {
          ...submission.id_verification_data,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_status: status,
          review_reason: reason || null
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) {
        throw error;
      }

      toast({
        title: `ID ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `User verification has been ${status}.`,
      });

      // Refresh the submissions list
      fetchSubmissions(currentTab === 'all' ? undefined : currentTab === 'pending' ? 'pending_review' : currentTab);

    } catch (error: any) {
      toast({
        title: "Error Updating Status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">ID Verification Admin</h1>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({submissions.filter(s => s.verification_status === 'pending_review').length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="space-y-4">
          {submissions.length === 0 ? (
            <Alert>
              <AlertDescription>
                No ID verification submissions found for this category.
              </AlertDescription>
            </Alert>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {submission.first_name} {submission.last_name}
                    </CardTitle>
                    {getStatusBadge(submission.verification_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Submission Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Submitted: {submission.id_verification_data?.submitted_at ? formatDate(submission.id_verification_data.submitted_at) : 'Unknown'}
                        </div>
                        <div className="flex items-center gap-2">
                          <FileImage className="w-4 h-4" />
                          Size: {submission.id_verification_data?.file_size ? formatFileSize(submission.id_verification_data.file_size) : 'Unknown'}
                        </div>
                        <div>Type: {submission.id_verification_data?.file_type || 'Unknown'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">ID Document</h4>
                      {submission.id_verification_data?.image_url ? (
                        <div className="relative">
                          <img
                            src={submission.id_verification_data.image_url}
                            alt="ID Document"
                            className="w-full max-w-sm rounded-lg border"
                          />
                          <a
                            href={submission.id_verification_data.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 right-2 bg-background/80 px-2 py-1 rounded text-xs hover:bg-background"
                          >
                            View Full Size
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No image available</p>
                      )}
                    </div>
                  </div>

                  {submission.verification_status === 'pending_review' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => updateVerificationStatus(submission.id, 'approved')}
                        disabled={processingId === submission.id}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateVerificationStatus(submission.id, 'rejected', 'ID requirements not met')}
                        disabled={processingId === submission.id}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {submission.verification_status !== 'pending_review' && submission.id_verification_data && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        <p>Reviewed: {(submission.id_verification_data as any).reviewed_at ? formatDate((submission.id_verification_data as any).reviewed_at) : 'Unknown'}</p>
                        {(submission.id_verification_data as any).review_reason && (
                          <p>Reason: {(submission.id_verification_data as any).review_reason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 