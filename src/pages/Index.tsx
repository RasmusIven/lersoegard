import { useState, useRef, useEffect } from "react";
import { Send, Loader2, FileText, Menu, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { DocumentList } from "@/components/DocumentList";
interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    name: string;
    id: string;
  }>;
  snippets?: Array<{
    document: string;
    text: string;
  }>;
}
interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  enabled: boolean;
  content: string | null;
  created_at: string;
}
const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  useEffect(() => {
    fetchDocuments();
  }, []);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  async function fetchDocuments() {
    const { data, error } = await supabase.from("documents").select("*").order("created_at", {
      ascending: false,
    });
    if (error) {
      console.error("Error fetching documents:", error);
      return;
    }
    setDocuments(data || []);
  }

  async function handleSendMessage() {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          question: input,
        },
      });
      if (error) throw error;
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        snippets: data.snippets,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke få svar. Prøv venligst igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  async function handleToggleDocument(id: string, enabled: boolean) {
    const { error } = await supabase
      .from("documents")
      .update({
        enabled,
      })
      .eq("id", id);
    if (error) {
      toast({
        title: "Fejl",
        description: "Kunne ikke opdatere dokument.",
        variant: "destructive",
      });
      return;
    }
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              enabled,
            }
          : doc,
      ),
    );
    toast({
      title: enabled ? "Dokument aktiveret" : "Dokument deaktiveret",
      description: enabled
        ? "Dette dokument vil blive inkluderet i søgninger."
        : "Dette dokument vil blive ekskluderet fra søgninger.",
    });
  }

  async function handleProcessDocuments() {
    const unprocessedDocs = documents.filter(doc => !doc.content);
    
    if (unprocessedDocs.length === 0) {
      toast({
        title: "Ingen dokumenter at behandle",
        description: "Alle dokumenter er allerede behandlet.",
      });
      return;
    }

    setIsProcessing(true);
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < unprocessedDocs.length; i++) {
      const doc = unprocessedDocs[i];
      
      try {
        const { error } = await supabase.functions.invoke('fetch-and-process-document', {
          body: { documentId: doc.id }
        });

        if (error) throw error;
        processedCount++;
      } catch (error) {
        console.error(`Failed to process ${doc.name}:`, error);
        failedCount++;
      }

      await new Promise(res => setTimeout(res, 800));
    }

    setIsProcessing(false);
    
    toast({
      title: "Behandling fuldført",
      description: `${processedCount} dokumenter startet, ${failedCount} fejlede`,
    });

    fetchDocuments();
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shadow-sm relative z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-poppins bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Lersøgard
                </h1>
                <p className="text-xs text-muted-foreground">Andels Chatbot</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessDocuments}
                disabled={isProcessing}
                className="hidden md:flex border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Behandler...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Behandl dokumenter
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowDocuments(!showDocuments)}
                variant="outline"
                size="icon"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                {showDocuments ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-6 flex gap-6 min-h-0 relative">
        {/* Left Panel - Chat */}
        <Card className="flex-1 flex flex-col shadow-lg border-border/50 min-w-0 z-0">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-md">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Velkommen til Lersøgard Chatbot</h2>
                  <p className="text-sm text-muted-foreground">
                    Stil spørgsmål her, så søger gennem vores dokumenter for at give præcise svar med kildehenvisninger.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, idx) => (
                  <ChatMessage key={idx} {...message} />
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-6 border-t border-border bg-muted/30">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Stil et spørgsmål om dine dokumenter..."
                disabled={isLoading}
                className="flex-1 bg-background border-border focus-visible:ring-primary"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Panel - Documents */}
        <Card 
          className={`
            w-96 shadow-lg border-border/50 overflow-hidden transition-all duration-300 ease-in-out
            ${showDocuments 
              ? 'fixed right-0 top-[73px] bottom-0 z-[15] lg:relative lg:top-0 lg:z-0' 
              : 'hidden lg:block'
            }
          `}
        >
          <DocumentList
            documents={documents}
            onToggle={handleToggleDocument}
          />
        </Card>

        {/* Overlay for mobile when documents are shown */}
        {showDocuments && (
          <div 
            className="fixed inset-0 bg-black/50 z-[10] lg:hidden top-[73px]"
            onClick={() => setShowDocuments(false)}
          />
        )}
      </div>
    </div>
  );
};
export default Index;
