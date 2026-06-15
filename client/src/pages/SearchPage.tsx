import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Search, Users, History, LogOut, Fingerprint,
  ExternalLink, Globe, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function SearchPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Still save to history for tracking purposes
  const searchMutation = trpc.search.arkham.useMutation({
    onSuccess: () => {
      setHasSearched(true);
    },
    onError: () => {
      setHasSearched(true);
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

  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(query.trim());

  const handleSearch = () => {
    if (!query.trim()) return;
    // Save to search history
    searchMutation.mutate({ query: query.trim(), queryType: isAddress ? "address" : "entity" });
  };

  const getArkhamUrl = () => {
    const q = query.trim();
    if (isAddress) {
      return `https://platform.arkhamintelligence.com/explorer/address/${q}`;
    }
    return `https://platform.arkhamintelligence.com/explorer/entity/${q}`;
  };

  const explorers = [
    { name: "Arkham Intelligence", url: getArkhamUrl(), primary: true },
    { name: "Hemi Explorer", url: `https://explorer.hemi.xyz/address/${query.trim()}` },
    { name: "Etherscan", url: `https://etherscan.io/address/${query.trim()}` },
    { name: "Polygonscan", url: `https://polygonscan.com/address/${query.trim()}` },
    { name: "Arbiscan", url: `https://arbiscan.io/address/${query.trim()}` },
    { name: "BaseScan", url: `https://basescan.org/address/${query.trim()}` },
    { name: "BscScan", url: `https://bscscan.com/address/${query.trim()}` },
    { name: "Optimistic Etherscan", url: `https://optimistic.etherscan.io/address/${query.trim()}` },
  ];

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
          <NavItem icon={<Search className="w-4 h-4" />} label="Arkham Search" active onClick={() => setLocation("/search")} />
          <NavItem icon={<History className="w-4 h-4" />} label="Search History" onClick={() => setLocation("/history")} />
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
            <h1 className="text-2xl font-bold tracking-tight">Address Lookup</h1>
            <p className="text-muted-foreground mt-1">
              Search an EVM address or entity and open it directly on Arkham Intelligence or block explorers
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter an EVM address (0x...) or entity name..."
                className="pl-10 bg-card border-border/50 h-12 text-base font-mono"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 h-12 px-6"
              onClick={handleSearch}
              disabled={!query.trim()}
            >
              Search
            </Button>
          </div>

          {/* Results - Explorer Links */}
          {hasSearched && query.trim() && (
            <div className="space-y-4">
              {/* Primary Arkham Link */}
              <Card className="bg-card border-primary/30 glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Arkham Intelligence</h3>
                        <p className="text-sm text-muted-foreground">
                          View entity labels, portfolio, and transaction history
                        </p>
                      </div>
                    </div>
                    <a
                      href={getArkhamUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all active:scale-[0.97]"
                    >
                      Open on Arkham
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Block Explorers */}
              {isAddress && (
                <Card className="bg-card border-border/50">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium mb-4">Block Explorers</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {explorers.filter(e => !e.primary).map(explorer => (
                        <a
                          key={explorer.name}
                          href={explorer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent/30 transition-all group"
                        >
                          <span>{explorer.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address Info */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {isAddress ? "Address" : "Entity"}
                    </Badge>
                    <code className="text-sm font-mono text-muted-foreground">{query.trim()}</code>
                  </div>
                  {isAddress && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {["Ethereum", "Polygon", "Arbitrum", "Optimism", "BSC", "Base", "Hemi"].map(chain => (
                        <Badge key={chain} variant="outline" className="text-xs text-muted-foreground">
                          {chain}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {!hasSearched && (
            <Card className="bg-card/50 border-border/50 border-dashed">
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">Search Arkham Intelligence</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Enter an EVM address or entity name to open it on Arkham Intelligence
                  and verify it across multiple block explorers.
                </p>
              </CardContent>
            </Card>
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
