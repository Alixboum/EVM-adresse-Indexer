import { useRef, useEffect, useState, useMemo } from "react";
import type { EvmAddress, AddressConnection } from "../../../drizzle/schema";

interface Props {
  addresses: EvmAddress[];
  connections: AddressConnection[];
  onDeleteConnection?: (id: number) => void;
}

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
  chain: string;
  address: string;
}

const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA",
  polygon: "#8247E5",
  arbitrum: "#28A0F0",
  optimism: "#FF0420",
  bsc: "#F3BA2F",
  hemi: "#00D4AA",
  base: "#0052FF",
  avalanche: "#E84142",
};

export default function ConnectionGraph({ addresses, connections, onDeleteConnection }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Calculate node positions in a circle layout
  const nodes = useMemo(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    return addresses.map((addr, i): Node => {
      const angle = (2 * Math.PI * i) / addresses.length - Math.PI / 2;
      return {
        id: addr.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        label: addr.label || addr.address.slice(0, 8) + "...",
        chain: addr.chain,
        address: addr.address,
      };
    });
  }, [addresses, dimensions]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(350, entry.contentRect.width * 0.55),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw connections (edges)
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.fromAddressId);
      const toNode = nodes.find(n => n.id === conn.toAddressId);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = "rgba(120, 140, 200, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const arrowLen = 10;
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;

      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - arrowLen * Math.cos(angle - Math.PI / 6),
        midY - arrowLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - arrowLen * Math.cos(angle + Math.PI / 6),
        midY - arrowLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.strokeStyle = "rgba(120, 140, 200, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Connection type label
      const labelX = midX;
      const labelY = midY - 10;
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = "rgba(160, 170, 200, 0.7)";
      ctx.textAlign = "center";
      ctx.fillText(conn.connectionType, labelX, labelY);
    });

    // Draw nodes
    nodes.forEach(node => {
      const color = CHAIN_COLORS[node.chain] || "#627EEA";
      const isHovered = hoveredNode?.id === node.id;
      const nodeRadius = isHovered ? 22 : 18;

      // Glow effect
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + "20";
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = color + "30";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.font = `${isHovered ? "12" : "11"}px Inter, sans-serif`;
      ctx.fillStyle = "#e0e4f0";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + nodeRadius + 16);

      // Chain indicator
      ctx.font = "9px Inter, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(node.chain, node.x, node.y + nodeRadius + 28);
    });
  }, [nodes, connections, hoveredNode, dimensions]);

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const found = nodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    setHoveredNode(found || null);
    canvas.style.cursor = found ? "pointer" : "default";
  };

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="rounded-lg"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
      />
      {hoveredNode && (
        <div className="mt-2 p-2 rounded-lg bg-accent/50 text-xs">
          <span className="font-mono">{hoveredNode.address}</span>
          <span className="ml-2 text-muted-foreground">({hoveredNode.chain})</span>
        </div>
      )}
    </div>
  );
}
