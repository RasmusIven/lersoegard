import { FileText, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  enabled: boolean;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  selectedDocId?: string;
}

export function DocumentList({ documents, onToggle, onDelete, onView, selectedDocId }: DocumentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    return <FileText className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Dokumenter</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {documents.length} dokument{documents.length !== 1 ? 'er' : ''} uploadet
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {documents.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Ingen dokumenter uploadet endnu</p>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card
                key={doc.id}
                className={`p-4 transition-all duration-200 hover:shadow-md ${
                  selectedDocId === doc.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.file_type)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.file_type.split('/').pop()?.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={doc.enabled}
                      onCheckedChange={(checked) => onToggle(doc.id, checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(doc.id)}
                    className="flex-1 text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Se
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(doc.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Slet
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
