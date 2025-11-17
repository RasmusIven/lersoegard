export function LoadingMessage() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shrink-0">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </div>
      <div className="flex-1 bg-muted/50 rounded-lg p-4 border border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tænker</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
