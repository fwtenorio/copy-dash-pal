-- Create evidence_field_configs table for customizable evidence requirements
CREATE TABLE public.evidence_field_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  problem_type TEXT NOT NULL, -- 'not_received', 'defect', 'regret', 'fraud'
  field_key TEXT NOT NULL, -- 'checked_carrier', 'custom_1', etc.
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'checkbox', 'radio', 'select', 'text', 'textarea', 'file'
  is_predefined BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  options JSONB, -- For select/radio: [{"value": "option1", "label": "Option 1"}]
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, problem_type, field_key)
);

-- Enable Row Level Security
ALTER TABLE public.evidence_field_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their company evidence configs
CREATE POLICY "Users can view their company evidence configs"
  ON public.evidence_field_configs
  FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

-- Policy: Admins can manage their company evidence configs (INSERT)
CREATE POLICY "Admins can insert their company evidence configs"
  ON public.evidence_field_configs
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()) AND client_id = get_user_client_id(auth.uid()));

-- Policy: Admins can manage their company evidence configs (UPDATE)
CREATE POLICY "Admins can update their company evidence configs"
  ON public.evidence_field_configs
  FOR UPDATE
  USING (is_admin(auth.uid()) AND client_id = get_user_client_id(auth.uid()))
  WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- Policy: Admins can manage their company evidence configs (DELETE)
CREATE POLICY "Admins can delete their company evidence configs"
  ON public.evidence_field_configs
  FOR DELETE
  USING (is_admin(auth.uid()) AND client_id = get_user_client_id(auth.uid()));

-- Policy: Allow public read for proxy (unauthenticated users via shop domain)
CREATE POLICY "Public can read evidence configs by client_id"
  ON public.evidence_field_configs
  FOR SELECT
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_evidence_field_configs_updated_at
  BEFORE UPDATE ON public.evidence_field_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_evidence_field_configs_client_problem 
  ON public.evidence_field_configs(client_id, problem_type);