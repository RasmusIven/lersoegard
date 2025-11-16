import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate embedding using OpenAI
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
    const error = await response.text();
    console.error('OpenAI embedding error:', error);
    throw new Error(`OpenAI embedding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    if (!question) {
      return new Response(
        JSON.stringify({ error: 'question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Question:', question);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all enabled documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('enabled', true);

    if (docsError) {
      console.error('Database query error:', docsError);
      throw docsError;
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'Ingen dokumenter er i øjeblikket aktiveret til søgning. Aktiver venligst mindst ét dokument.',
          sources: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${documents.length} enabled documents`);

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // Find most relevant documents and chunks
    const relevantChunks: Array<{
      documentId: string;
      documentName: string;
      chunkText: string;
      similarity: number;
    }> = [];

    for (const doc of documents) {
      if (!doc.embedding || !doc.chunks) {
        console.log(`Skipping document ${doc.name} - missing embedding or chunks`);
        continue;
      }

      // Parse embedding if it's stored as string
      let embedding = doc.embedding;
      if (typeof embedding === 'string') {
        try {
          embedding = JSON.parse(embedding);
        } catch (e) {
          console.error(`Failed to parse embedding for ${doc.name}:`, e);
          continue;
        }
      }

      // Calculate similarity with document
      const docSimilarity = cosineSimilarity(questionEmbedding, embedding);

      // Find relevant chunks
      const chunks = doc.chunks as Array<{ index: number; text: string; length: number }>;
      for (const chunk of chunks) {
        relevantChunks.push({
          documentId: doc.id,
          documentName: doc.name,
          chunkText: chunk.text,
          similarity: docSimilarity, // Using doc similarity as proxy
        });
      }
    }

    // Sort by similarity and take top 5
    relevantChunks.sort((a, b) => b.similarity - a.similarity);
    const topChunks = relevantChunks.slice(0, 5);

    console.log(`Found ${topChunks.length} relevant chunks`);

    if (topChunks.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'Ingen relevant information fundet i de aktiverede dokumenter.',
          sources: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for GPT
    const context = topChunks
      .map((c, i) => `[Document: ${c.documentName}]\n${c.chunkText}`)
      .join('\n\n---\n\n');

    // Call OpenAI for answer generation
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du er en hjælpsom assistent, der besvarer spørgsmål baseret på uddrag fra dokumenter. Svar altid på dansk. Angiv altid, hvilke dokumenter du brugte til at besvare spørgsmålet. Hvis dokumenterne ikke indeholder relevant information, skal du sige det klart.',
          },
          {
            role: 'user',
            content: `Based on these document excerpts:\n\n${context}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!completion.ok) {
      const error = await completion.text();
      console.error('OpenAI chat error:', error);
      throw new Error(`OpenAI chat failed: ${completion.status}`);
    }

    const completionData = await completion.json();
    const answer = completionData.choices[0].message.content;

    // Build sources list (unique document names)
    const sources = [...new Set(topChunks.map(c => ({
      name: c.documentName,
      id: c.documentId,
    })))];

    // Build snippets
    const snippets = topChunks.slice(0, 3).map(c => ({
      document: c.documentName,
      text: c.chunkText.substring(0, 200) + (c.chunkText.length > 200 ? '...' : ''),
    }));

    return new Response(
      JSON.stringify({
        answer,
        sources,
        snippets,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process question' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});