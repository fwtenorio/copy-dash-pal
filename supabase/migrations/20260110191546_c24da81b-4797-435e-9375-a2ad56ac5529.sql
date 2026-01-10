-- Create dispute_requests table for approval-based resolution flow
CREATE TABLE public.dispute_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  problem_type TEXT NOT NULL CHECK (problem_type IN ('not_received', 'defect', 'regret', 'cancel', 'fraud')),
  evidence_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferred_resolution TEXT NOT NULL CHECK (preferred_resolution IN ('credit', 'refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed')),
  admin_bonus_percentage DECIMAL(5,2),
  order_total DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  protocol_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_dispute_requests_client_id ON public.dispute_requests(client_id);
CREATE INDEX idx_dispute_requests_status ON public.dispute_requests(status);
CREATE INDEX idx_dispute_requests_order_id ON public.dispute_requests(order_id);
CREATE INDEX idx_dispute_requests_protocol ON public.dispute_requests(protocol_number);

-- Enable Row Level Security
ALTER TABLE public.dispute_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispute_requests
-- Clients can view their own dispute requests
CREATE POLICY "Clients can view their dispute requests"
ON public.dispute_requests
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Admins can view all dispute requests for their company
CREATE POLICY "Admins can manage dispute requests"
ON public.dispute_requests
FOR ALL
USING (is_admin(auth.uid()) AND client_id = get_user_client_id(auth.uid()))
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- Service role can insert (for edge function)
CREATE POLICY "Service role can insert dispute requests"
ON public.dispute_requests
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dispute_requests_updated_at
BEFORE UPDATE ON public.dispute_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();