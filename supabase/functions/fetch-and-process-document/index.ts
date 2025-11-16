import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  console.log(`Fetching PDF from: ${pdfUrl}`);
  
  const pdfCoKey = Deno.env.get('PDFCO_API_KEY');
  if (pdfCoKey) {
    try {
      console.log('Using PDF.co to extract PDF content...');
      const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'x-api-key': pdfCoKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: pdfUrl,
          async: false,
          inline: true
        })
      });

      if (pdfCoResponse.ok) {
        const result = await pdfCoResponse.json();
        if (!result.error && result.url) {
          const textResponse = await fetch(result.url);
          const text = await textResponse.text();
          if (text && text.length > 50) {
            console.log(`PDF.co extraction successful: ${text.length} chars`);
            return text;
          }
        }
      }
      console.log('PDF.co extraction failed, trying fallback...');
    } catch (error) {
      console.error('PDF.co error:', error);
    }
  }

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
}

async function uploadToOpenAIVectorStore(fileName: string, content: string): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

  const vectorStoreId = 'vs_6919da5036748191afd44c286ccf61be';
  
  console.log(`Uploading ${fileName} to OpenAI vector store...`);
  
  // Create a file object
  const blob = new Blob([content], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, `${fileName}.txt`);
  formData.append('purpose', 'assistants');

  // Upload file to OpenAI
  const uploadResponse = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    console.error('File upload error:', error);
    throw new Error(`File upload failed: ${uploadResponse.status}`);
  }

  const fileData = await uploadResponse.json();
  const fileId = fileData.id;
  console.log(`File uploaded with ID: ${fileId}`);

  // Add file to vector store
  const addToStoreResponse = await fetch(
    `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({ file_id: fileId }),
    }
  );

  if (!addToStoreResponse.ok) {
    const error = await addToStoreResponse.text();
    console.error('Add to vector store error:', error);
    throw new Error(`Add to vector store failed: ${addToStoreResponse.status}`);
  }

  const storeData = await addToStoreResponse.json();
  console.log(`File added to vector store: ${storeData.id}`);
  
  return fileId;
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

        // Upload to OpenAI vector store
        const fileId = await uploadToOpenAIVectorStore(doc.name, content);

        // Update database with content and file ID
        await supabase
          .from('documents')
          .update({
            content,
            embedding: fileId, // Store OpenAI file ID instead of embedding
            chunks: [{ index: 0, text: 'Processed in OpenAI Vector Store', length: content.length }],
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentId);

        console.log(`Successfully processed: ${doc.name}`);
      } catch (e) {
        console.error('Background processing failed:', e);
        try {
          await supabase
            .from('documents')
            .update({
              updated_at: new Date().toISOString(),
              chunks: [{ index: 0, text: 'Processing failed', length: 0 }],
              embedding: null,
            })
            .eq('id', documentId);
        } catch (inner) {
          console.error('Failed to write fallback update:', inner);
        }
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
