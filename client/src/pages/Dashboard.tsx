import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Plus, Search, Network, Users, History, LogOut,
  Fingerprint, ExternalLink, MoreHorizontal, Trash2,
  Download, FileJson, FileSpreadsheet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchFilter, setSearchFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newTags, setNewTags] = useState("");
  const [exporting, setExporting] = useState(false);

  const exportQuery = trpc.export.all.useQuery(undefined, { enabled: false });

  const csvRow = (fields: string[]) => {
    return fields.map(f => {
      const escaped = f.replace(/"/g, '""');
      return f.includes(',') || f.includes('"') || f.includes('\n') ? `"${escaped}"` : f;
    }).join(',');
  };

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    try {
      const result = await exportQuery.refetch();
      const data = result.data;
      if (!data) {
        toast.error("No data to export");
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(data, null, 2);
        filename = `evm-indexer-export-${new Date().toISOString().slice(0, 10)}.json`;
        mimeType = "application/json";
      } else {
        // CSV format - flatten profiles with their addresses and socials
        const rows: string[] = [];
        rows.push("profile_name,profile_tags,profile_notes,address,chain,label,address_notes,arkham_entity,arkham_labels,social_platform,social_username,social_verified");

        for (const profile of data.profiles) {
          const profileAddresses = data.addresses.filter(a => a.profileId === profile.id);
          const profileSocials = data.socials.filter(s => s.profileId === profile.id);

          if (profileAddresses.length === 0 && profileSocials.length === 0) {
            rows.push(csvRow([profile.name, profile.tags || "", profile.notes || "", "", "", "", "", "", "", "", "", ""]));
          } else {
            const maxLen = Math.max(profileAddresses.length, profileSocials.length, 1);
            for (let i = 0; i < maxLen; i++) {
              const addr = profileAddresses[i];
              const social = profileSocials[i];
              rows.push(csvRow([
                i === 0 ? profile.name : "",
                i === 0 ? (profile.tags || "") : "",
                i === 0 ? (profile.notes || "") : "",
                addr?.address || "",
                addr?.chain || "",
                addr?.label || "",
                addr?.notes || "",
                addr?.arkhamEntity || "",
                addr?.arkhamLabels || "",
                social?.platform || "",
                social?.username || "",
                social ? String(social.verified) : "",
              ]));
            }
          }
        }
        content = rows.join("\n");
        filename = `evm-indexer-export-${new Date().toISOString().slice(0, 10)}.csv`;
        mimeType = "text/csv";
      }

      // Trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()} successfully`);
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const profilesQuery = trpc.profiles.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.profiles.create.useMutation({
    onSuccess: () => {
      profilesQuery.refetch();
      setCreateOpen(false);
      setNewName("");
      setNewNotes("");
      setNewTags("");
      toast.success("Profile created successfully");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.profiles.delete.useMutation({
    onSuccess: () => {
      profilesQuery.refetch();
      toast.success("Profile deleted");
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

  const filteredProfiles = profilesQuery.data?.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.tags && p.tags.toLowerCase().includes(searchFilter.toLowerCase()))
  ) || [];

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
          <NavItem icon={<Users className="w-4 h-4" />} label="Profiles" active onClick={() => setLocation("/dashboard")} />
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
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Investigation Profiles</h1>
              <p className="text-muted-foreground mt-1">Manage your on-chain investigation profiles</p>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-border/50" disabled={exporting}>
                    <Download className="w-4 h-4 mr-2" />
                    {exporting ? "Exporting..." : "Export"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={() => handleExport("json")} className="cursor-pointer">
                    <FileJson className="w-4 h-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    New Profile
                  </Button>
                </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create Investigation Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Whale Wallet Cluster"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input
                      placeholder="e.g., whale, defi, nft"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Investigation notes..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => createMutation.mutate({ name: newName, notes: newNotes, tags: newTags })}
                    disabled={!newName.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Profile"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter profiles by name or tags..."
              className="pl-10 bg-card border-border/50"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          {/* Profiles Grid */}
          {profilesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-card border-border/50 animate-pulse">
                  <CardContent className="p-6 h-40" />
                </Card>
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <Card className="bg-card/50 border-border/50 border-dashed">
              <CardContent className="p-12 text-center">
                <Network className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No profiles yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first investigation profile to start tracking addresses.
                </p>
                <Button variant="outline" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map(profile => (
                <Card
                  key={profile.id}
                  className="bg-card border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                  onClick={() => setLocation(`/profile/${profile.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {profile.name[0]?.toUpperCase()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this profile?")) {
                            deleteMutation.mutate({ id: profile.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {profile.name}
                    </h3>
                    {profile.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.tags.split(",").slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {profile.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{profile.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                      <span>Created {new Date(profile.createdAt).toLocaleDateString()}</span>
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
