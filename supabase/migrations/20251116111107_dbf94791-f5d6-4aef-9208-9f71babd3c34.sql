-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
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

-- Allow all users to read all documents (public chatbot)
CREATE POLICY "Anyone can view documents"
  ON public.documents
  FOR SELECT
  USING (true);

-- Allow all users to manage documents (public chatbot)
CREATE POLICY "Anyone can insert documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update documents"
  ON public.documents
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete documents"
  ON public.documents
  FOR DELETE
  USING (true);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760,
  ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
);

-- Storage policies for public access
CREATE POLICY "Anyone can view documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Anyone can upload documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can update documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'documents');

CREATE POLICY "Anyone can delete documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'documents');

-- Create index for similarity search
CREATE INDEX ON public.documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();