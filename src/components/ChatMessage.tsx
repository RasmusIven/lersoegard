import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Snippet {
  document: string;
  text: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    name: string;
    file_path: string;
  }>;
  snippets?: Snippet[];
}

export function ChatMessage({ role, content, sources, snippets }: ChatMessageProps) {
  const handleSourceClick = (filePath: string) => {
    // Open the document using its file path
    if (filePath.startsWith('http')) {
      window.open(filePath, '_blank');
    } else {
      window.open(filePath, '_blank');
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
              {sources.map((source, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                  onClick={() => handleSourceClick(source.file_path)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {source.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
