-- Enable pgvector extension first
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop and recreate the documents table
DROP TABLE IF EXISTS public.documents CASCADE;

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  content TEXT,
  embedding vector(1536),
  chunks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow all users to manage documents (public chatbot)
CREATE POLICY "Anyone can view documents"
  ON public.documents FOR SELECT USING (true);

CREATE POLICY "Anyone can insert documents"
  ON public.documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update documents"
  ON public.documents FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete documents"
  ON public.documents FOR DELETE USING (true);

-- Create index for similarity search
CREATE INDEX documents_embedding_idx ON public.documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();