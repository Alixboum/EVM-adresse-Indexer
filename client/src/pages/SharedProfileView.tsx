import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "wouter";
import {
  Fingerprint, Globe, ExternalLink, Twitter, Shield, ShieldCheck, Link2
} from "lucide-react";

export default function SharedProfileView() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";

  const sharedQuery = trpc.sharing.viewShared.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  if (sharedQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sharedQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="bg-card border-border/50 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Fingerprint className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Share Link Invalid</h2>
            <p className="text-sm text-muted-foreground">
              This share link is invalid, expired, or has been revoked.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = sharedQuery.data;
  if (!data) return null;

  const { profile, addresses, socials, connections } = data;

  const getExplorerUrl = (address: string, chain: string) => {
    const explorers: Record<string, string> = {
      ethereum: `https://etherscan.io/address/${address}`,
      polygon: `https://polygonscan.com/address/${address}`,
      arbitrum: `https://arbiscan.io/address/${address}`,
      optimism: `https://optimistic.etherscan.io/address/${address}`,
      base: `https://basescan.org/address/${address}`,
      bsc: `https://bscscan.com/address/${address}`,
      hemi: `https://explorer.hemi.xyz/address/${address}`,
    };
    return explorers[chain] || `https://etherscan.io/address/${address}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">EVM Indexer</span>
            <Badge variant="outline" className="ml-auto text-xs">
              Shared Profile (Read-only)
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
              {profile.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
              {profile.tags && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.tags.split(",").map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {profile.notes && (
            <p className="text-sm text-muted-foreground mt-4 bg-accent/30 rounded-lg p-3">
              {profile.notes}
            </p>
          )}
        </div>

        {/* Addresses */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            EVM Addresses ({addresses.length})
          </h2>
          <div className="space-y-3">
            {addresses.map((addr) => (
              <Card key={addr.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {addr.label && (
                          <span className="text-sm font-medium">{addr.label}</span>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {addr.chain}
                        </Badge>
                        {addr.arkhamEntity && (
                          <Badge className="bg-primary/10 text-primary text-xs">
                            {addr.arkhamEntity}
                          </Badge>
                        )}
                      </div>
                      <code className="text-xs font-mono text-muted-foreground">
                        {addr.address}
                      </code>
                      {addr.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{addr.notes}</p>
                      )}
                    </div>
                    <a
                      href={getExplorerUrl(addr.address, addr.chain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors ml-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
            {addresses.length === 0 && (
              <p className="text-sm text-muted-foreground">No addresses linked to this profile.</p>
            )}
          </div>
        </div>

        {/* Social Accounts */}
        {socials.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Social Accounts ({socials.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socials.map((social) => (
                <Card key={social.id} className="bg-card border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      <Twitter className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">@{social.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{social.platform}</p>
                    </div>
                    {social.verified ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Shield className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        {connections.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Address Connections ({connections.length})
            </h2>
            <div className="space-y-2">
              {connections.map((conn) => {
                const fromAddr = addresses.find(a => a.id === conn.fromAddressId);
                const toAddr = addresses.find(a => a.id === conn.toAddressId);
                return (
                  <Card key={conn.id} className="bg-card border-border/50">
                    <CardContent className="p-3 flex items-center gap-3 text-xs">
                      <code className="text-muted-foreground truncate max-w-[140px]">
                        {fromAddr?.label || fromAddr?.address.slice(0, 10) + "..."}
                      </code>
                      <div className="flex items-center gap-1 text-primary">
                        <Link2 className="w-3 h-3" />
                        <span className="capitalize">{conn.connectionType}</span>
                      </div>
                      <code className="text-muted-foreground truncate max-w-[140px]">
                        {toAddr?.label || toAddr?.address.slice(0, 10) + "..."}
                      </code>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
