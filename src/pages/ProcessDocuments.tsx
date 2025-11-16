import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface Document {
  id: string;
  name: string;
  file_path: string;
  content: string | null;
}

export default function ProcessDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchUnprocessedDocuments();
  }, []);

  const fetchUnprocessedDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('id, name, file_path, content')
      .is('content', null)
      .or('file_path.like.http://%,file_path.like.https://%');

    if (error) {
      toast({
        title: "Fejl",
        description: "Kunne ikke hente dokumenter",
        variant: "destructive",
      });
      return;
    }

    setDocuments(data || []);
  };

  const processAllDocuments = async () => {
    setProcessing(true);
    setProcessedCount(0);
    setFailedCount(0);
    setProgress(0);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`Processing document ${i + 1}/${documents.length}: ${doc.name}`);

      try {
        const { data, error } = await supabase.functions.invoke('fetch-and-process-document', {
          body: { documentId: doc.id }
        });

        if (error) throw error;

        console.log(`Successfully processed: ${doc.name}`, data);
        setProcessedCount(prev => prev + 1);
      } catch (error) {
        console.error(`Failed to process ${doc.name}:`, error);
        setFailedCount(prev => prev + 1);
      }

      setProgress(((i + 1) / documents.length) * 100);
    }

    setProcessing(false);
    
    toast({
      title: "Behandling fuldført",
      description: `${processedCount} dokumenter behandlet, ${failedCount} fejlede`,
    });

    // Refresh the list
    fetchUnprocessedDocuments();
  };

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Behandl Dokumenter</h1>
        
        <div className="mb-6">
          <p className="text-muted-foreground mb-4">
            {documents.length} dokumenter mangler behandling
          </p>
          
          {processing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Behandler... {Math.round(progress)}%
                <br />
                Gennemført: {processedCount} | Fejlet: {failedCount}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={processAllDocuments}
          disabled={processing || documents.length === 0}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Behandler dokumenter...
            </>
          ) : (
            'Start behandling'
          )}
        </Button>

        <div className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">Dokumenter der skal behandles:</h2>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-muted rounded-lg flex items-center justify-between"
              >
                <span className="text-sm truncate flex-1">{doc.name}</span>
                {processing && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
