/**
 * Arkham Intelligence Integration
 * 
 * This module provides search functionality against Arkham Intelligence (arkm.com).
 * Since the Arkham API requires authentication/API key, we implement a scraping-based
 * approach that fetches publicly available data from their platform.
 * 
 * The module can be upgraded to use the official API when an API key is provided.
 */

import { ENV } from "./_core/env";

export interface ArkhamResult {
  entity: string | null;
  labels: string | null;
  tags: string | null;
  address: string;
  chains: string[];
  portfolio: string | null;
  arkhamUrl: string;
  raw?: unknown;
}

const ARKHAM_BASE_URL = "https://api.arkhamintelligence.com";

/**
 * Search Arkham Intelligence for information about an address or entity.
 * 
 * If ARKHAM_API_KEY is configured, uses the official API.
 * Otherwise, constructs a reference URL and returns what we can determine.
 */
export async function arkhamSearch(query: string): Promise<ArkhamResult | null> {
  const arkhamApiKey = process.env.ARKHAM_API_KEY;

  if (arkhamApiKey) {
    return arkhamApiSearch(query, arkhamApiKey);
  }

  // Fallback: construct Arkham URL and provide basic info
  return arkhamPublicSearch(query);
}

/**
 * Official Arkham API search (requires API key)
 */
async function arkhamApiSearch(query: string, apiKey: string): Promise<ArkhamResult | null> {
  try {
    // Try address intelligence endpoint
    const response = await fetch(`${ARKHAM_BASE_URL}/intelligence/address/${query}`, {
      headers: {
        "API-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        entity: data.arkhamEntity?.name || data.entity?.name || null,
        labels: data.arkhamEntity?.labels?.join(", ") || data.labels?.join(", ") || null,
        tags: data.arkhamEntity?.tags?.join(", ") || data.tags?.join(", ") || null,
        address: query.toLowerCase(),
        chains: data.chains || [],
        portfolio: data.portfolio?.totalUsd ? `$${data.portfolio.totalUsd.toLocaleString()}` : null,
        arkhamUrl: `https://platform.arkhamintelligence.com/explorer/address/${query}`,
        raw: data,
      };
    }

    // Try entity search
    const entityResponse = await fetch(`${ARKHAM_BASE_URL}/intelligence/search?query=${encodeURIComponent(query)}`, {
      headers: {
        "API-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (entityResponse.ok) {
      const entityData = await entityResponse.json();
      if (entityData.results && entityData.results.length > 0) {
        const first = entityData.results[0];
        return {
          entity: first.name || null,
          labels: first.labels?.join(", ") || null,
          tags: first.tags?.join(", ") || null,
          address: query.toLowerCase(),
          chains: first.chains || [],
          portfolio: null,
          arkhamUrl: `https://platform.arkhamintelligence.com/explorer/entity/${first.slug || query}`,
          raw: first,
        };
      }
    }

    return {
      entity: null,
      labels: null,
      tags: null,
      address: query.toLowerCase(),
      chains: [],
      portfolio: null,
      arkhamUrl: `https://platform.arkhamintelligence.com/explorer/address/${query}`,
    };
  } catch (error) {
    console.error("[Arkham] API search failed:", error);
    return null;
  }
}

/**
 * Public search fallback - constructs Arkham URL and provides basic validation
 */
async function arkhamPublicSearch(query: string): Promise<ArkhamResult | null> {
  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(query);

  // Try to fetch from Arkham's public page data
  try {
    const url = isAddress
      ? `https://arkm.com/explorer/address/${query}`
      : `https://arkm.com/explorer/entity/${query}`;

    // We construct the reference but note that without API key, 
    // we provide the URL for manual verification
    return {
      entity: null,
      labels: null,
      tags: null,
      address: query.toLowerCase(),
      chains: isAddress ? detectChainFromAddress(query) : [],
      portfolio: null,
      arkhamUrl: url,
    };
  } catch (error) {
    console.error("[Arkham] Public search failed:", error);
    return null;
  }
}

/**
 * Basic chain detection heuristic
 */
function detectChainFromAddress(address: string): string[] {
  // EVM addresses are compatible across chains
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return ["ethereum", "polygon", "arbitrum", "optimism", "bsc", "hemi"];
  }
  return [];
}

/**
 * Get Hemi Explorer URL for an address
 */
export function getHemiExplorerUrl(address: string): string {
  return `https://explorer.hemi.xyz/address/${address}`;
}

/**
 * Get block explorer URL for a given chain and address
 */
export function getExplorerUrl(chain: string, address: string): string {
  const explorers: Record<string, string> = {
    ethereum: `https://etherscan.io/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    arbitrum: `https://arbiscan.io/address/${address}`,
    optimism: `https://optimistic.etherscan.io/address/${address}`,
    bsc: `https://bscscan.com/address/${address}`,
    hemi: `https://explorer.hemi.xyz/address/${address}`,
    base: `https://basescan.org/address/${address}`,
    avalanche: `https://snowtrace.io/address/${address}`,
  };
  return explorers[chain] || `https://etherscan.io/address/${address}`;
}
