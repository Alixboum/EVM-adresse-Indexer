import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Search, Database, Network, Shield, ArrowRight, Fingerprint } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight">EVM Indexer</span>
          </div>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Powered by Arkham Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            <span className="gradient-text">Index, Link & Investigate</span>
            <br />
            <span className="text-foreground">EVM Addresses</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A premium investigation tool to centralize, enrich and visualize on-chain profiles 
            linked to real or pseudonymous identities across all EVM networks.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 glow"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full">
          <FeatureCard
            icon={<Search className="w-5 h-5" />}
            title="Arkham Intelligence"
            description="Search and enrich addresses with entity labels, tags, and portfolio data from Arkham."
          />
          <FeatureCard
            icon={<Network className="w-5 h-5" />}
            title="Connection Graph"
            description="Visualize relationships between addresses with an interactive connection graph."
          />
          <FeatureCard
            icon={<Database className="w-5 h-5" />}
            title="Profile Database"
            description="Organize addresses into profiles with social accounts and custom labels."
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Multi-Chain Support"
            description="Track addresses across Ethereum, Polygon, Arbitrum, Hemi, and more."
          />
          <FeatureCard
            icon={<Fingerprint className="w-5 h-5" />}
            title="Identity Linking"
            description="Connect social accounts (X/Twitter) to on-chain identities."
          />
          <FeatureCard
            icon={<Database className="w-5 h-5" />}
            title="Search History"
            description="Keep a full audit trail of all your investigations and lookups."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          EVM Address Indexer — Built for on-chain investigators
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 hover:glow">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
