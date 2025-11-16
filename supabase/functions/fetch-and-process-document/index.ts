import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start = end - overlap;
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log(`Fetching PDF from: ${pdfUrl}`);
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.mjs');

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    console.log(`PDF loaded, pages: ${pdf.numPages}`);

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (e) {
    console.error('PDF extraction failed:', e);
    throw e instanceof Error ? e : new Error('PDF extraction failed');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) throw new Error('Document not found');

    if (!doc.file_path.startsWith('http')) {
      return new Response(
        JSON.stringify({ error: 'Only external URLs supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting text from:', doc.name);
    const content = await extractTextFromPDF(doc.file_path);
    console.log(`Extracted ${content.length} characters`);

    const textChunks = chunkText(content);
    const embedding = await generateEmbedding(content.substring(0, 8000));
    
    const chunks = textChunks.map((text, index) => ({
      index,
      text,
      length: text.length,
    }));

    await supabase
      .from('documents')
      .update({
        content,
        embedding: JSON.stringify(embedding),
        chunks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        chunks: chunks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
