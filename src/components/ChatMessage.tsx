import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Snippet {
  document: string;
  text: string;
}

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  enabled: boolean;
  created_at: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  snippets?: Snippet[];
  documents?: Document[];
}

export function ChatMessage({ role, content, sources, snippets, documents = [] }: ChatMessageProps) {
  const handleSourceClick = (sourceName: string) => {
    // Find the matching document
    const document = documents.find(doc => doc.name === sourceName);
    
    if (document) {
      // Open the actual document
      const filePath = document.file_path;
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        window.open(filePath, '_blank');
      } else {
        // Internal Supabase storage
        const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
        if (data?.publicUrl) {
          window.open(data.publicUrl, '_blank');
        }
      }
    } else {
      // Fallback to main website if document not found
      window.open('https://abl1926.dk', '_blank');
    }
  };
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[80%] ${role === "user" ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : "bg-card border border-border"} rounded-2xl px-6 py-4 shadow-sm`}>
        <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-strong:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {sources && sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Kilder:</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                  onClick={() => handleSourceClick(source)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
