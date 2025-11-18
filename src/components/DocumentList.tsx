import { FileText, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

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
  isAdmin?: boolean;
}

export function DocumentList({ documents, onToggle, isAdmin = false }: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileLabel = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return 'PDF';
    if (t.includes('wordprocessingml')) return 'DOCX';
    if (t.includes('msword')) return 'DOC';
    if (t.includes('spreadsheetml')) return 'XLSX';
    if (t.includes('ms-excel')) return 'XLS';
    if (t.includes('presentationml')) return 'PPTX';
    if (t.startsWith('image/')) return 'IMG';
    if (t.startsWith('text/')) return 'TXT';
    const fallback = t.split('/').pop() || t;
    return fallback.slice(0, 8).toUpperCase();
  };

  const getFileIcon = (type: string) => {
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const handleOpenDocument = async (filePath: string) => {
    // Check if it's an external URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      window.open(filePath, '_blank');
    } else {
      // Internal Supabase storage
      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
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

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group documents by category
  const groupedDocs = categories.map(cat => {
    if (cat.subcategories.length > 0) {
      return {
        title: cat.title,
        hasSubcategories: true,
        subcategories: cat.subcategories.map(sub => ({
          name: sub,
          docs: filteredDocuments.filter(doc => doc.category === sub)
        }))
      };
    }
    return {
      title: cat.title,
      hasSubcategories: false,
      docs: filteredDocuments.filter(doc => doc.category === cat.title)
    };
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Dokumenter</h2>
        <p className="text-[10px] text-muted-foreground mt-1">
          {documents.length} dokument{documents.length !== 1 ? 'er' : ''} indlæst fra A/B Lersøgaard
        </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Søg efter dokumenter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
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
                <div key={category.title} className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground px-2 pt-1">{category.title}</h3>
                  
                  {category.hasSubcategories ? (
                    category.subcategories.map((sub) => {
                      if (sub.docs.length === 0) return null;
                      return (
                        <div key={sub.name} className="space-y-2 px-2">
                          <h4 className="text-xs font-semibold text-muted-foreground/80 px-2 ml-2 uppercase tracking-wide">{sub.name}</h4>
                          {sub.docs.map((doc) => (
                            <Card
                              key={doc.id}
                              className="w-full max-w-full p-3 transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden"
                            >
                              <div className="flex items-start justify-between gap-3 w-full">
                                <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                                  {getFileIcon(doc.file_type)}
                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <button
                                      onClick={() => handleOpenDocument(doc.file_path)}
                                      className="text-sm font-medium text-foreground hover:text-primary truncate block w-full text-left underline decoration-dotted underline-offset-2 leading-snug"
                                    >
                                      {doc.name}
                                    </button>
                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap min-w-0">
                                        <Badge variant="outline" className="text-[10px] py-0.5 px-2 h-5 font-medium max-w-[50%] truncate">
                                          {getFileLabel(doc.file_type)}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatFileSize(doc.file_size)}
                                        </span>
                                      </div>
                                  </div>
                                </div>
                                
                                <Switch
                                  checked={doc.enabled}
                                  onCheckedChange={(checked) => onToggle(doc.id, checked)}
                                  className="shrink-0"
                                  disabled={!isAdmin}
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
                        className="w-full max-w-full p-3 transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                            {getFileIcon(doc.file_type)}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <button
                                onClick={() => handleOpenDocument(doc.file_path)}
                                className="text-sm font-medium text-foreground hover:text-primary truncate block w-full text-left underline decoration-dotted underline-offset-2 leading-snug"
                              >
                                {doc.name}
                              </button>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap min-w-0">
                                  <Badge variant="outline" className="text-[10px] py-0.5 px-2 h-5 font-medium max-w-[50%] truncate">
                                    {getFileLabel(doc.file_type)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                </div>
                            </div>
                          </div>
                          
                          <Switch
                            checked={doc.enabled}
                            onCheckedChange={(checked) => onToggle(doc.id, checked)}
                            className="shrink-0"
                            disabled={!isAdmin}
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
