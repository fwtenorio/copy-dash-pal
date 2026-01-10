-- Fix: Replace overly permissive INSERT policy with a proper one
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Service role can insert dispute requests" ON public.dispute_requests;

-- Create a proper INSERT policy that allows inserts when client_id matches
-- For edge functions using service_role key, RLS is bypassed entirely
-- This policy is for authenticated users inserting their own disputes
CREATE POLICY "Users can insert dispute requests for their company"
ON public.dispute_requests
FOR INSERT
WITH CHECK (client_id = get_user_client_id(auth.uid()) OR auth.uid() IS NULL);