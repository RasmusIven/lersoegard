-- Add category field to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Andre dokumenter';

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);