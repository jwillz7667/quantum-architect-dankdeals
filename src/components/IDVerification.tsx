import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, IdCard, CheckCircle, AlertTriangle, RefreshCw, FileImage } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface IDVerificationProps {
  onVerificationComplete: (isVerified: boolean, isSubmitted?: boolean) => void;
  onSkip?: () => void;
}

export const IDVerification = ({ onVerificationComplete, onSkip }: IDVerificationProps) => {
  const [currentStep, setCurrentStep] = useState<'instructions' | 'upload' | 'review' | 'submitting' | 'submitted'>('instructions');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCurrentStep('review');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const submitForReview = useCallback(async () => {
    if (!selectedFile || !user) return;

    setIsSubmitting(true);
    setError(null);
    setCurrentStep('submitting');

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `id-verification/${user.id}/${timestamp}.${fileExtension}`;

      // Upload image to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('id-documents')
        .getPublicUrl(fileName);

             // Update user profile with ID verification submission
       const { error: updateError } = await supabase
         .from('profiles')
         .update({
           id_verification_data: {
             image_url: publicUrl,
             image_path: fileName,
             submitted_at: new Date().toISOString(),
             status: 'pending_review',
             file_size: selectedFile.size,
             file_type: selectedFile.type
           },
           verification_status: 'pending_review',
           is_id_verified: false, // Will be set to true by admin after review
           id_verification_date: new Date().toISOString()
         })
         .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      setCurrentStep('submitted');
      toast({
        title: "ID Submitted Successfully",
        description: "Your ID has been submitted for review. You'll be notified when verification is complete.",
      });

      // Notify parent component that submission was successful
      onVerificationComplete(false, true); // Not verified yet, but submitted

    } catch (err: any) {
      setError(err.message);
      setCurrentStep('review');
      toast({
        title: "Submission Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, user, onVerificationComplete, toast]);

  const startOver = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setCurrentStep('instructions');
  }, [previewUrl]);

  const retakePhoto = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setCurrentStep('upload');
  }, [previewUrl]);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-primary" />
            ID Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 'instructions' && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  To comply with Minnesota cannabis laws, we need to verify your age and identity. 
                  Your ID will be reviewed by our team within 24 hours.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-medium">Requirements:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">1</span>
                    A clear photo of your government-issued photo ID (driver's license, passport, or state ID)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">2</span>
                    All information on the ID must be clearly visible and readable
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">3</span>
                    You must be 21 or older to use this service
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">4</span>
                    File must be under 10MB in size
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setCurrentStep('upload')} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ID Photo
                </Button>
                {onSkip && (
                  <Button variant="outline" onClick={onSkip}>
                    Skip for Now
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FileImage className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your ID photo here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="id-upload"
                />
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => document.getElementById('id-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <Button variant="outline" onClick={() => setCurrentStep('instructions')}>
                Back
              </Button>
            </div>
          )}

          {currentStep === 'review' && previewUrl && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="ID verification upload"
                  className="w-full rounded-lg border"
                />
                <Badge className="absolute top-2 right-2 bg-background/80">
                  {selectedFile?.name}
                </Badge>
              </div>
              
              <Alert>
                <IdCard className="h-4 w-4" />
                <AlertDescription>
                  Make sure all information on your ID is clearly visible and readable. 
                  Our team will review this within 24 hours.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={submitForReview} 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit for Review
                </Button>
                <Button variant="outline" onClick={retakePhoto}>
                  Choose Different Photo
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'submitting' && (
            <div className="space-y-4 text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary" />
              <div>
                <h4 className="font-medium mb-2">Submitting your ID...</h4>
                <p className="text-sm text-muted-foreground">
                  Please wait while we securely upload your documents.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'submitted' && (
            <div className="space-y-4">
              <Alert className="border-primary/20 bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                  Your ID has been submitted successfully! Our team will review it within 24 hours 
                  and you'll receive an email notification when verification is complete.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pending Review</Badge>
                  <span className="text-sm text-muted-foreground">
                    Submitted {new Date().toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can continue using the app, but some features may be limited until verification is complete.
                </p>
              </div>

              <Button onClick={startOver} variant="outline" className="w-full">
                Submit Different ID
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};