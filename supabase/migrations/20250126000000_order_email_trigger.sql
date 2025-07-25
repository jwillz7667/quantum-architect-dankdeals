-- Create email queue table for async email processing
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('order_confirmation', 'order_update', 'delivery_notification')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create function to queue emails when order is confirmed
CREATE OR REPLACE FUNCTION public.queue_order_confirmation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue email when order is confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.email_queue (order_id, email_type, status)
    VALUES (NEW.id, 'order_confirmation', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email queue
DROP TRIGGER IF EXISTS queue_order_email ON public.orders;
CREATE TRIGGER queue_order_email
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_order_confirmation_email();

-- Create index for email queue processing
CREATE INDEX idx_email_queue_pending ON public.email_queue(status, created_at) 
WHERE status = 'pending';

-- Update trigger for email_queue
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create policy for service role to manage email queue
CREATE POLICY "Service role can manage email queue" ON public.email_queue
  FOR ALL USING (true) WITH CHECK (true); 