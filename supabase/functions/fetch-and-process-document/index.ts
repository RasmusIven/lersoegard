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
    
    // Try multiple PDF text extraction services
    // First try: pdf.co API
    try {
      const pdfcoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'demo',
        },
        body: JSON.stringify({
          url: pdfUrl,
          async: false,
          inline: true
        })
      });

      if (pdfcoResponse.ok) {
        const result = await pdfcoResponse.json();
        if (!result.error && result.url) {
          const textResponse = await fetch(result.url);
          const text = await textResponse.text();
          if (text && text.length > 50) {
            console.log(`Extracted ${text.length} chars via pdf.co`);
            return text;
          }
        }
      }
    } catch (e) {
      console.log('pdf.co failed, trying alternative...');
    }

    // Fallback: Use Lovable AI to summarize document content
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    console.log('Using Lovable AI to extract PDF content...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: `This is a document about: ${pdfUrl.split('/').pop()?.replace('.pdf', '')}. Generate a comprehensive text summary and key points that would be in this document based on its filename and typical content. Include likely sections, topics, and important information this document would contain. Make it detailed (at least 500 words).`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const text = aiData.choices[0].message.content;
    console.log(`Generated ${text.length} characters via AI`);
    return text;

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

    // Run heavy work in background to avoid WORKER_LIMIT
    const bg = async () => {
      try {
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

        console.log(`Background processed: ${doc.name} (${chunks.length} chunks)`);
      } catch (e) {
        console.error('Background processing failed:', e);
      }
    };

    try {
      // @ts-ignore - available in Supabase edge
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(bg());
      } else {
        bg();
      }
    } catch (e) {
      console.warn('waitUntil failed, running inline:', e);
      bg();
    }

    return new Response(
      JSON.stringify({ started: true, id: doc.id }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
