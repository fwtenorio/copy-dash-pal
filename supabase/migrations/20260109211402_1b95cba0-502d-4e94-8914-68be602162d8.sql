-- Add missing sender settings columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS sender_from_name TEXT,
ADD COLUMN IF NOT EXISTS sender_reply_to_email TEXT,
ADD COLUMN IF NOT EXISTS sender_email_footer TEXT;