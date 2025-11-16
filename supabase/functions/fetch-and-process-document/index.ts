import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
  console.log(`Fetching PDF from: ${pdfUrl}`);
  
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'demo',
    },
    body: JSON.stringify({
      url: pdfUrl,
      async: false
    })
  });

  if (!response.ok) {
    throw new Error(`PDF.co API failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.error) throw new Error(result.message);

  const textResponse = await fetch(result.url);
  return await textResponse.text();
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
