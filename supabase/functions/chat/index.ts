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
      .select('name, file_path')
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

    // Get assistant ID from environment
    const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID not configured');
    }

    // Create a thread for the conversation
    console.log('Creating OpenAI thread...');
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: question,
        }],
      }),
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.text();
      console.error('Thread creation error:', error);
      throw new Error(`Thread creation failed: ${threadResponse.status}`);
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log(`Thread created: ${threadId}`);

    // Run the assistant with vector store
    console.log('Running assistant with vector store...');
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      console.error('Run creation error:', error);
      throw new Error(`Run creation failed: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log(`Run created: ${runId}`);

    // Poll for completion
    let runStatus = runData.status;
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      console.log(`Run status: ${runStatus}`);
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run did not complete. Status: ${runStatus}`);
    }

    // Get messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      throw new Error('Failed to retrieve messages');
    }

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    let answer = assistantMessage.content[0].text.value;
    console.log('Generated answer');

    // Extract citations from annotations
    const annotations = assistantMessage.content[0].text.annotations || [];
    
    // Remove citation markers from the answer text
    // Sort by start_index descending to avoid index shifting issues
    const sortedAnnotations = [...annotations].sort((a, b) => b.start_index - a.start_index);
    for (const annotation of sortedAnnotations) {
      if (annotation.type === 'file_citation') {
        answer = answer.slice(0, annotation.start_index) + answer.slice(annotation.end_index);
      }
    }
    
    // Get unique file IDs from citations
    const fileIds = [...new Set(annotations
      .filter((a: any) => a.type === 'file_citation')
      .map((a: any) => a.file_citation?.file_id)
      .filter(Boolean))] as string[];
    
    // Fetch file details from OpenAI to get actual filenames
    const fileDetailsPromises = fileIds.map(async (fileId) => {
      const fileResponse = await fetch(`https://api.openai.com/v1/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
      });
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        return fileData.filename;
      }
      return null;
    });
    
    const filenames = (await Promise.all(fileDetailsPromises)).filter(Boolean) as string[];
    
    // Match filenames with our document names and get their paths
    const sourceDocuments = [...new Set(filenames.map((filename) => {
      const doc = documents.find(d => 
        filename.includes(d.name) || d.name.includes(filename.replace('.pdf', ''))
      );
      return doc ? { name: doc.name, file_path: doc.file_path } : { name: filename, file_path: '' };
    }))];

    // Extract text snippets from the answer where citations appear
    const snippets = annotations
      .filter((a: any) => a.type === 'file_citation')
      .slice(0, 3)
      .map((a: any) => {
        const startIndex = Math.max(0, a.start_index - 100);
        const endIndex = Math.min(answer.length, a.end_index + 100);
        const context = answer.substring(startIndex, endIndex).trim();
        return {
          document: sourceDocuments[0]?.name || 'Dokument',
          text: context
        };
      });

    return new Response(
      JSON.stringify({ 
        answer,
        sources: sourceDocuments,
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
