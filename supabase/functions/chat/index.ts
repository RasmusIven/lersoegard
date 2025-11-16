import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

    const vectorStoreId = 'vs_6919da5036748191afd44c286ccf61be';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching enabled documents...');
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('name')
      .eq('enabled', true)
      .not('content', 'is', null);

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!documents || documents.length === 0) {
      console.log('No enabled documents found');
      return new Response(
        JSON.stringify({ 
          answer: 'Ingen dokumenter er i øjeblikket aktiveret til søgning. Aktiver venligst mindst ét dokument.',
          sources: [],
          snippets: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${documents.length} enabled documents`);

    // Search the vector store directly
    console.log('Searching vector store...');
    const searchResponse = await fetch(
      `https://api.openai.com/v1/vector_stores/${vectorStoreId}/file_search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          query: question,
          max_num_results: 5,
        }),
      }
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('Vector store search error:', error);
      throw new Error(`Vector store search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log(`Found ${searchData.results?.length || 0} relevant chunks`);

    // Build context from search results
    let context = '';
    const sources = new Set<string>();
    const snippets: Array<{ source: string; text: string }> = [];

    if (searchData.results && searchData.results.length > 0) {
      for (const result of searchData.results.slice(0, 3)) {
        const fileName = result.file?.filename || 'Unknown';
        sources.add(fileName);
        context += `\nFrom ${fileName}:\n${result.content || result.text || ''}\n`;
        
        if (snippets.length < 3) {
          snippets.push({
            source: fileName,
            text: (result.content || result.text || '').substring(0, 200) + '...'
          });
        }
      }
    }

    // If no results found, return early
    if (!context) {
      return new Response(
        JSON.stringify({ 
          answer: 'Jeg kunne ikke finde relevant information i dokumenterne til at besvare dit spørgsmål.',
          sources: [],
          snippets: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use OpenAI chat completions with the context
    console.log('Generating answer with OpenAI...');
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Du er en hjælpsom assistent, der besvarer spørgsmål baseret på de tilgængelige dokumenter. Citér altid, hvilke dokumenter du refererer til. Svar altid på dansk.'
          },
          {
            role: 'user',
            content: `Baseret på følgende information fra dokumenterne, besvar venligst spørgsmålet:\n\n${context}\n\nSpørgsmål: ${question}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      console.error('Chat completion error:', error);
      throw new Error(`Chat completion failed: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        answer,
        sources: Array.from(sources),
        snippets
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Chat request failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
