-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure extension is in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column if it doesn't exist
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- Create the index with proper operator class
DROP INDEX IF EXISTS public.documents_embedding_idx;
CREATE INDEX documents_embedding_idx 
  ON public.documents 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);