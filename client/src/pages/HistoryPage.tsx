import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  Search, Users, History, LogOut, Fingerprint,
  ExternalLink, Trash2, Clock
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function HistoryPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const historyQuery = trpc.search.history.useQuery(undefined, { enabled: isAuthenticated });
  const deleteMutation = trpc.search.deleteEntry.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      toast.success("Entry deleted");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-sidebar flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">EVM Indexer</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<Users className="w-4 h-4" />} label="Profiles" onClick={() => setLocation("/dashboard")} />
          <NavItem icon={<Search className="w-4 h-4" />} label="Arkham Search" onClick={() => setLocation("/search")} />
          <NavItem icon={<History className="w-4 h-4" />} label="Search History" active onClick={() => setLocation("/history")} />
        </nav>
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => logout()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Search History</h1>
            <p className="text-muted-foreground mt-1">
              Your past Arkham Intelligence searches and enrichment lookups
            </p>
          </div>

          {historyQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-card border-border/50 animate-pulse">
                  <CardContent className="p-4 h-16" />
                </Card>
              ))}
            </div>
          ) : !historyQuery.data || historyQuery.data.length === 0 ? (
            <Card className="bg-card/50 border-border/50 border-dashed">
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No search history</h3>
                <p className="text-sm text-muted-foreground">
                  Your Arkham Intelligence searches will appear here.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setLocation("/search")}>
                  <Search className="w-4 h-4 mr-2" />
                  Start Searching
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {historyQuery.data.map(entry => (
                <Card key={entry.id} className="bg-card border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-foreground">
                            {entry.query.length > 42 ? entry.query.slice(0, 42) + "..." : entry.query}
                          </code>
                          <Badge variant="outline" className="text-xs capitalize">
                            {entry.queryType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                          {entry.resultSummary && (
                            <span>Result: {entry.resultSummary}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/^0x[a-fA-F0-9]{40}$/.test(entry.query) && (
                          <a
                            href={`https://platform.arkhamintelligence.com/explorer/address/${entry.query}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate({ id: entry.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
