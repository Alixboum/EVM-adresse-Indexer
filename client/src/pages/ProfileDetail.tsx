import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Plus, ExternalLink, Trash2, RefreshCw, Network,
  Twitter, Globe, Copy, Check, Fingerprint, Search, Users, History, LogOut, Link2, Shield, Pencil, Share2
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import ConnectionGraph from "@/components/ConnectionGraph";

const CHAINS = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
  { value: "bsc", label: "BSC" },
  { value: "hemi", label: "Hemi" },
  { value: "base", label: "Base" },
  { value: "avalanche", label: "Avalanche" },
];

const EXPLORERS: Record<string, string> = {
  ethereum: "https://etherscan.io/address/",
  polygon: "https://polygonscan.com/address/",
  arbitrum: "https://arbiscan.io/address/",
  optimism: "https://optimistic.etherscan.io/address/",
  bsc: "https://bscscan.com/address/",
  hemi: "https://explorer.hemi.xyz/address/",
  base: "https://basescan.org/address/",
  avalanche: "https://snowtrace.io/address/",
};

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [addSocialOpen, setAddSocialOpen] = useState(false);
  const [addConnectionOpen, setAddConnectionOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Edit profile form
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");

  // Edit address form
  const [editAddrId, setEditAddrId] = useState<number | null>(null);
  const [editAddrLabel, setEditAddrLabel] = useState("");
  const [editAddrChain, setEditAddrChain] = useState("");
  const [editAddrNotes, setEditAddrNotes] = useState("");

  // Address form
  const [newAddress, setNewAddress] = useState("");
  const [newChain, setNewChain] = useState("ethereum");
  const [newLabel, setNewLabel] = useState("");
  const [newAddrNotes, setNewAddrNotes] = useState("");

  // Social form
  const [newSocialPlatform, setNewSocialPlatform] = useState("twitter");
  const [newSocialUsername, setNewSocialUsername] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  // Connection form
  const [connFrom, setConnFrom] = useState<number | null>(null);
  const [connTo, setConnTo] = useState<number | null>(null);
  const [connType, setConnType] = useState("transfer");
  const [connNotes, setConnNotes] = useState("");

  const profileQuery = trpc.profiles.get.useQuery(
    { id: parseInt(id || "0") },
    { enabled: isAuthenticated && !!id }
  );

  const addAddressMutation = trpc.addresses.add.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setAddAddressOpen(false);
      setNewAddress("");
      setNewChain("ethereum");
      setNewLabel("");
      setNewAddrNotes("");
      toast.success("Address added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAddressMutation = trpc.addresses.delete.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      toast.success("Address removed");
    },
  });

  const enrichMutation = trpc.addresses.enrich.useMutation({
    onSuccess: (data) => {
      profileQuery.refetch();
      if (data?.entity) {
        toast.success(`Enriched: ${data.entity}`);
      } else {
        toast.info("No Arkham entity found for this address");
      }
    },
    onError: () => toast.error("Enrichment failed"),
  });

  const addSocialMutation = trpc.socials.add.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setAddSocialOpen(false);
      setNewSocialUsername("");
      setNewSocialUrl("");
      toast.success("Social account added");
    },
  });

  const deleteSocialMutation = trpc.socials.delete.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      toast.success("Social account removed");
    },
  });

  const toggleVerifiedMutation = trpc.socials.toggleVerified.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      toast.success("Verification status updated");
    },
  });

  const addConnectionMutation = trpc.connections.add.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setAddConnectionOpen(false);
      setConnFrom(null);
      setConnTo(null);
      setConnNotes("");
      toast.success("Connection added");
    },
  });

  const deleteConnectionMutation = trpc.connections.delete.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      toast.success("Connection removed");
    },
  });

  const updateProfileMutation = trpc.profiles.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setEditProfileOpen(false);
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateAddressMutation = trpc.addresses.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setEditAddressOpen(false);
      setEditAddrId(null);
      toast.success("Address updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const shareMutation = trpc.sharing.createLink.useMutation({
    onSuccess: (result) => {
      const shareUrl = `${window.location.origin}/shared/${result.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    },
    onError: (err) => toast.error(err.message),
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

  const data = profileQuery.data;

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

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
        <div className="max-w-6xl mx-auto">
          {/* Back button and header */}
          <Button variant="ghost" className="mb-6 text-muted-foreground" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profiles
          </Button>

          {profileQuery.isLoading ? (
            <div className="space-y-4">
              <div className="h-8 w-64 bg-card animate-pulse rounded" />
              <div className="h-4 w-96 bg-card animate-pulse rounded" />
            </div>
          ) : !data ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Profile not found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                    {data.profile.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">{data.profile.name}</h1>
                    {data.profile.tags && (
                      <div className="flex gap-1 mt-1">
                        {data.profile.tags.split(",").map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => shareMutation.mutate({ profileId: data.profile.id, permission: "view" })}
                    disabled={shareMutation.isPending}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {shareMutation.isPending ? "Sharing..." : "Share"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      setEditName(data.profile.name);
                      setEditNotes(data.profile.notes || "");
                      setEditTags(data.profile.tags || "");
                      setEditProfileOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>

              {/* Edit Profile Dialog */}
              <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tags (comma-separated)</Label>
                      <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="tag1, tag2" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
                    </div>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => updateProfileMutation.mutate({
                        id: data.profile.id,
                        name: editName,
                        notes: editNotes || undefined,
                        tags: editTags || undefined,
                      })}
                      disabled={!editName.trim() || updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Address Dialog */}
              <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Edit Address</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input value={editAddrLabel} onChange={(e) => setEditAddrLabel(e.target.value)} placeholder="My wallet" />
                    </div>
                    <div className="space-y-2">
                      <Label>Chain</Label>
                      <Select value={editAddrChain} onValueChange={setEditAddrChain}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHAINS.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={editAddrNotes} onChange={(e) => setEditAddrNotes(e.target.value)} rows={2} />
                    </div>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => {
                        if (editAddrId) {
                          updateAddressMutation.mutate({
                            id: editAddrId,
                            label: editAddrLabel || undefined,
                            chain: editAddrChain || undefined,
                            notes: editAddrNotes || undefined,
                          });
                        }
                      }}
                      disabled={updateAddressMutation.isPending}
                    >
                      {updateAddressMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {data.profile.notes && (
                <Card className="bg-card/50 border-border/50 mb-6">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{data.profile.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="addresses" className="space-y-6">
                <TabsList className="bg-card border border-border/50">
                  <TabsTrigger value="addresses">Addresses ({data.addresses.length})</TabsTrigger>
                  <TabsTrigger value="connections">Connections ({data.connections.length})</TabsTrigger>
                  <TabsTrigger value="socials">Social ({data.socials.length})</TabsTrigger>
                </TabsList>

                {/* Addresses Tab */}
                <TabsContent value="addresses" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={addAddressOpen} onOpenChange={setAddAddressOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Address
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Add EVM Address</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                              placeholder="0x..."
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Chain</Label>
                            <Select value={newChain} onValueChange={setNewChain}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CHAINS.map(c => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              placeholder="e.g., Main Wallet"
                              value={newLabel}
                              onChange={(e) => setNewLabel(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              placeholder="Optional notes..."
                              value={newAddrNotes}
                              onChange={(e) => setNewAddrNotes(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => addAddressMutation.mutate({
                              profileId: data.profile.id,
                              address: newAddress,
                              chain: newChain,
                              label: newLabel || undefined,
                              notes: newAddrNotes || undefined,
                            })}
                            disabled={!newAddress.trim() || addAddressMutation.isPending}
                          >
                            {addAddressMutation.isPending ? "Adding..." : "Add Address"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {data.addresses.length === 0 ? (
                    <Card className="bg-card/50 border-border/50 border-dashed">
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground text-sm">No addresses added yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {data.addresses.map(addr => (
                        <Card key={addr.id} className="bg-card border-border/50 hover:border-primary/20 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {addr.label && (
                                    <span className="font-medium text-sm">{addr.label}</span>
                                  )}
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {addr.chain}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs font-mono text-muted-foreground">
                                    {addr.address}
                                  </code>
                                  <button
                                    onClick={() => copyAddress(addr.address)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {copiedAddress === addr.address ? (
                                      <Check className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                {addr.arkhamEntity && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge className="bg-primary/10 text-primary text-xs">
                                      {addr.arkhamEntity}
                                    </Badge>
                                    {addr.arkhamLabels && (
                                      <span className="text-xs text-muted-foreground">{addr.arkhamLabels}</span>
                                    )}
                                  </div>
                                )}
                                {addr.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{addr.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                  onClick={() => {
                                    setEditAddrId(addr.id);
                                    setEditAddrLabel(addr.label || "");
                                    setEditAddrChain(addr.chain);
                                    setEditAddrNotes(addr.notes || "");
                                    setEditAddressOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                  onClick={() => enrichMutation.mutate({ id: addr.id })}
                                  disabled={enrichMutation.isPending}
                                >
                                  <RefreshCw className={`w-4 h-4 ${enrichMutation.isPending ? "animate-spin" : ""}`} />
                                </Button>
                                <a
                                  href={EXPLORERS[addr.chain] ? `${EXPLORERS[addr.chain]}${addr.address}` : `https://etherscan.io/address/${addr.address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    if (confirm("Remove this address?")) {
                                      deleteAddressMutation.mutate({ id: addr.id });
                                    }
                                  }}
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
                </TabsContent>

                {/* Connections Tab */}
                <TabsContent value="connections" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={addConnectionOpen} onOpenChange={setAddConnectionOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary hover:bg-primary/90" disabled={data.addresses.length < 2}>
                          <Link2 className="w-4 h-4 mr-2" />
                          Add Connection
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Add Connection</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>From Address</Label>
                            <Select value={connFrom?.toString() || ""} onValueChange={(v) => setConnFrom(parseInt(v))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source address" />
                              </SelectTrigger>
                              <SelectContent>
                                {data.addresses.map(a => (
                                  <SelectItem key={a.id} value={a.id.toString()}>
                                    {a.label || a.address.slice(0, 10) + "..."} ({a.chain})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>To Address</Label>
                            <Select value={connTo?.toString() || ""} onValueChange={(v) => setConnTo(parseInt(v))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target address" />
                              </SelectTrigger>
                              <SelectContent>
                                {data.addresses.filter(a => a.id !== connFrom).map(a => (
                                  <SelectItem key={a.id} value={a.id.toString()}>
                                    {a.label || a.address.slice(0, 10) + "..."} ({a.chain})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Connection Type</Label>
                            <Select value={connType} onValueChange={setConnType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="funding">Funding</SelectItem>
                                <SelectItem value="contract_interaction">Contract Interaction</SelectItem>
                                <SelectItem value="same_owner">Same Owner</SelectItem>
                                <SelectItem value="related">Related</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              placeholder="Optional notes about this connection..."
                              value={connNotes}
                              onChange={(e) => setConnNotes(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => {
                              if (connFrom && connTo) {
                                addConnectionMutation.mutate({
                                  fromAddressId: connFrom,
                                  toAddressId: connTo,
                                  connectionType: connType,
                                  notes: connNotes || undefined,
                                });
                              }
                            }}
                            disabled={!connFrom || !connTo || addConnectionMutation.isPending}
                          >
                            {addConnectionMutation.isPending ? "Adding..." : "Add Connection"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Connection Graph */}
                  {data.addresses.length >= 2 && data.connections.length > 0 ? (
                    <Card className="bg-card border-border/50">
                      <CardContent className="p-4">
                        <ConnectionGraph
                          addresses={data.addresses}
                          connections={data.connections}
                          onDeleteConnection={(id: number) => deleteConnectionMutation.mutate({ id })}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card/50 border-border/50 border-dashed">
                      <CardContent className="p-8 text-center">
                        <Network className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                          {data.addresses.length < 2
                            ? "Add at least 2 addresses to create connections"
                            : "No connections yet. Link addresses to visualize relationships."}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Connection List */}
                  {data.connections.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {data.connections.map(conn => {
                        const fromAddr = data.addresses.find(a => a.id === conn.fromAddressId);
                        const toAddr = data.addresses.find(a => a.id === conn.toAddressId);
                        return (
                          <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono text-xs">{fromAddr?.label || fromAddr?.address.slice(0, 8) + "..."}</span>
                              <Badge variant="outline" className="text-xs">{conn.connectionType}</Badge>
                              <span className="font-mono text-xs">{toAddr?.label || toAddr?.address.slice(0, 8) + "..."}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteConnectionMutation.mutate({ id: conn.id })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Socials Tab */}
                <TabsContent value="socials" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={addSocialOpen} onOpenChange={setAddSocialOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Social
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Add Social Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Platform</Label>
                            <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="twitter">X (Twitter)</SelectItem>
                                <SelectItem value="telegram">Telegram</SelectItem>
                                <SelectItem value="discord">Discord</SelectItem>
                                <SelectItem value="github">GitHub</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Username</Label>
                            <Input
                              placeholder="@username"
                              value={newSocialUsername}
                              onChange={(e) => setNewSocialUsername(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Profile URL (optional)</Label>
                            <Input
                              placeholder="https://x.com/username"
                              value={newSocialUrl}
                              onChange={(e) => setNewSocialUrl(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => addSocialMutation.mutate({
                              profileId: data.profile.id,
                              platform: newSocialPlatform,
                              username: newSocialUsername,
                              profileUrl: newSocialUrl || undefined,
                            })}
                            disabled={!newSocialUsername.trim() || addSocialMutation.isPending}
                          >
                            {addSocialMutation.isPending ? "Adding..." : "Add Social Account"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {data.socials.length === 0 ? (
                    <Card className="bg-card/50 border-border/50 border-dashed">
                      <CardContent className="p-8 text-center">
                        <Twitter className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No social accounts linked yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {data.socials.map(social => (
                        <Card key={social.id} className="bg-card border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                                  {social.platform === "twitter" ? (
                                    <Twitter className="w-4 h-4 text-foreground" />
                                  ) : (
                                    <Globe className="w-4 h-4 text-foreground" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{social.username}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{social.platform}</p>
                                </div>
                                {social.verified === 1 && (
                                  <Badge className="bg-green-500/10 text-green-500 text-xs">Verified</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-8 px-2 text-xs ${social.verified === 1 ? 'text-green-500 hover:text-red-400' : 'text-muted-foreground hover:text-green-500'}`}
                                  onClick={() => toggleVerifiedMutation.mutate({ id: social.id, verified: social.verified === 1 ? 0 : 1 })}
                                  title={social.verified === 1 ? 'Mark as unverified' : 'Mark as verified'}
                                >
                                  {social.verified === 1 ? <Check className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                </Button>
                                {social.profileUrl && (
                                  <a
                                    href={social.profileUrl}
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
                                  onClick={() => deleteSocialMutation.mutate({ id: social.id })}
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
                </TabsContent>
              </Tabs>
            </>
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
