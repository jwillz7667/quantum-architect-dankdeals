import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Camera, IdCard, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { calculateAge, isLegalAge } from '@/lib/security';

interface IDVerificationProps {
  onVerificationComplete: (isVerified: boolean, dateOfBirth?: string) => void;
  onSkip?: () => void;
}

export const IDVerification = ({ onVerificationComplete, onSkip }: IDVerificationProps) => {
  const [step, setStep] = useState<'instructions' | 'capture' | 'review' | 'complete'>('instructions');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    ageVerified: boolean;
    dateOfBirth?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep('capture');
    } catch (err) {
      setError('Camera access is required for ID verification. Please allow camera access and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    setCapturedImage(imageData);
    stopCamera();
    setStep('review');
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  const processVerification = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate ID verification process
      // In a real app, this would send the image to an ID verification service
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock verification result - in production, this would come from the verification service
      const mockDateOfBirth = '1990-01-01'; // This would be extracted from the ID
      const age = calculateAge(mockDateOfBirth);
      const ageVerified = isLegalAge(mockDateOfBirth);

      const result = {
        isValid: true, // ID is readable and valid
        ageVerified,
        dateOfBirth: mockDateOfBirth
      };

      setVerificationResult(result);
      setStep('complete');
      
      // Call parent callback
      onVerificationComplete(result.isValid && result.ageVerified, result.dateOfBirth);
    } catch (err) {
      setError('Failed to verify ID. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, onVerificationComplete]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

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
          {step === 'instructions' && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  To comply with Minnesota cannabis laws and ensure delivery safety, we need to verify your age and identity.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-medium">What you'll need:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">1</span>
                    A valid government-issued photo ID (driver's license, passport, or state ID)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">2</span>
                    Hold your ID next to your face for the photo
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">3</span>
                    Ensure good lighting and that your ID is clearly visible
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Verification
                </Button>
                {onSkip && (
                  <Button variant="outline" onClick={onSkip}>
                    Skip for Now
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'capture' && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-muted"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-primary border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                    <p className="text-sm text-primary bg-background/80 px-2 py-1 rounded">
                      Hold ID next to your face
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Photo
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && capturedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured ID verification"
                  className="w-full rounded-lg"
                />
              </div>
              
              <Alert>
                <IdCard className="h-4 w-4" />
                <AlertDescription>
                  Please review the photo. Make sure your face and ID are clearly visible and readable.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={processVerification} 
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify ID
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={retakePhoto}>
                  Retake
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && verificationResult && (
            <div className="space-y-4">
              {verificationResult.isValid && verificationResult.ageVerified ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ID verification successful! Your age has been confirmed as 21+.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {!verificationResult.isValid 
                      ? "We couldn't verify your ID. Please ensure it's clearly visible and try again."
                      : "You must be 21 or older to use this service."
                    }
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2">
                <Badge variant={verificationResult.ageVerified ? "default" : "destructive"}>
                  {verificationResult.ageVerified ? "Age Verified" : "Age Not Verified"}
                </Badge>
                <Badge variant={verificationResult.isValid ? "default" : "destructive"}>
                  {verificationResult.isValid ? "ID Valid" : "ID Invalid"}
                </Badge>
              </div>

              {(!verificationResult.isValid || !verificationResult.ageVerified) && (
                <Button onClick={retakePhoto} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
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