import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Source {
  name: string;
  id: string;
}

interface Snippet {
  document: string;
  text: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  snippets?: Snippet[];
}

export function ChatMessage({ role, content, sources, snippets }: ChatMessageProps) {
  const handleSourceClick = async (sourceId: string) => {
    const { data: doc } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', sourceId)
      .single();
    
    if (doc?.file_path) {
      // Check if it's an external URL
      if (doc.file_path.startsWith('http://') || doc.file_path.startsWith('https://')) {
        window.open(doc.file_path, '_blank');
      } else {
        // Internal Supabase storage
        const { data } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
        if (data?.publicUrl) {
          window.open(data.publicUrl, '_blank');
        }
      }
    }
  };
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[80%] ${role === "user" ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : "bg-card border border-border"} rounded-2xl px-6 py-4 shadow-sm`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        
        {sources && sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Kilder:</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <Badge
                  key={source.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                  onClick={() => handleSourceClick(source.id)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {source.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {snippets && snippets.length > 0 && (
          <div className="mt-3 space-y-2">
            {snippets.map((snippet, idx) => (
              <Card key={idx} className="p-3 bg-muted/30 border-none">
                <p className="text-xs font-medium text-primary mb-1">{snippet.document}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{snippet.text}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
