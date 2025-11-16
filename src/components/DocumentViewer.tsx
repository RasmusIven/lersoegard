import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DocumentViewerProps {
  documentId: string;
  onClose: () => void;
}

export function DocumentViewer({ documentId, onClose }: DocumentViewerProps) {
  const [content, setContent] = useState<string>("");
  const [documentName, setDocumentName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (error) throw error;

        setDocumentName(data.name);
        
        if (data.content) {
          setContent(data.content);
        } else {
          setContent("Intet indhold tilgængeligt for dette dokument. Genbehandl det venligst.");
        }
      } catch (error) {
        console.error('Error loading document:', error);
        setContent("Fejl ved indlæsning af dokumentindhold.");
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [documentId]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Dokument Fremviser</h2>
            <p className="text-sm text-muted-foreground">{documentName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <Card className="p-6 bg-card">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
              {content}
            </pre>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}
