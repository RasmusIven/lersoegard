import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  enabled: boolean;
  created_at: string;
  category?: string;
}

interface DocumentListProps {
  documents: Document[];
  onToggle: (id: string, enabled: boolean) => void;
}

export function DocumentList({ documents, onToggle }: DocumentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const handleOpenDocument = async (filePath: string) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  // Define categories and their structure
  const categories = [
    {
      title: "A/B Lersøgaard",
      subcategories: [
        "Reglementer",
        "Information",
        "Blanketter og vejledninger",
        "Generalforsamlinger",
        "Årsrapporter (regnskaber)",
        "Økonomi – Andre dokumenter",
        "Bestyrelsesmøder"
      ]
    },
    {
      title: "Gårdlauget",
      subcategories: [
        "Bestyrelsesmøder – Gårdlauget",
        "Generalforsamlinger – Gårdlauget",
        "Regnskab – Gårdlauget"
      ]
    },
    {
      title: "Parknet",
      subcategories: []
    },
    {
      title: "Andre dokumenter",
      subcategories: []
    },
    {
      title: "Privatlivspolitik",
      subcategories: []
    }
  ];

  // Group documents by category
  const groupedDocs = categories.map(cat => {
    if (cat.subcategories.length > 0) {
      return {
        title: cat.title,
        hasSubcategories: true,
        subcategories: cat.subcategories.map(sub => ({
          name: sub,
          docs: documents.filter(doc => doc.category === sub)
        }))
      };
    }
    return {
      title: cat.title,
      hasSubcategories: false,
      docs: documents.filter(doc => doc.category === cat.title)
    };
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Dokumenter</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {documents.length} dokument{documents.length !== 1 ? 'er' : ''} uploadet
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Ingen dokumenter uploadet endnu</p>
            </Card>
          ) : (
            groupedDocs.map((category) => {
              const hasDocs = category.hasSubcategories 
                ? category.subcategories.some(sub => sub.docs.length > 0)
                : category.docs.length > 0;
              
              if (!hasDocs) return null;

              return (
                <div key={category.title} className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground px-1">{category.title}</h3>
                  
                  {category.hasSubcategories ? (
                    category.subcategories.map((sub) => {
                      if (sub.docs.length === 0) return null;
                      return (
                        <div key={sub.name} className="space-y-1.5">
                          <h4 className="text-xs font-medium text-muted-foreground px-1 ml-2">{sub.name}</h4>
                          {sub.docs.map((doc) => (
                            <Card
                              key={doc.id}
                              className="p-2.5 transition-all duration-200 hover:shadow-sm ml-4"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {getFileIcon(doc.file_type)}
                                  <div className="flex-1 min-w-0">
                                    <button
                                      onClick={() => handleOpenDocument(doc.file_path)}
                                      className="text-xs font-medium text-foreground hover:text-primary truncate block w-full text-left underline decoration-dotted underline-offset-2"
                                    >
                                      {doc.name}
                                    </button>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                        {doc.file_type.split('/').pop()?.toUpperCase()}
                                      </Badge>
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatFileSize(doc.file_size)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <Switch
                                  checked={doc.enabled}
                                  onCheckedChange={(checked) => onToggle(doc.id, checked)}
                                  className="scale-75"
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    category.docs.map((doc) => (
                      <Card
                        key={doc.id}
                        className="p-2.5 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {getFileIcon(doc.file_type)}
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => handleOpenDocument(doc.file_path)}
                                className="text-xs font-medium text-foreground hover:text-primary truncate block w-full text-left underline decoration-dotted underline-offset-2"
                              >
                                {doc.name}
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                  {doc.file_type.split('/').pop()?.toUpperCase()}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatFileSize(doc.file_size)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Switch
                            checked={doc.enabled}
                            onCheckedChange={(checked) => onToggle(doc.id, checked)}
                            className="scale-75"
                          />
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
