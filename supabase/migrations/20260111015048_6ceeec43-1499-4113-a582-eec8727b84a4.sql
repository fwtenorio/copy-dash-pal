-- Add faq_data column to clients table for storing FAQ configuration
ALTER TABLE public.clients 
ADD COLUMN faq_data JSONB DEFAULT NULL;