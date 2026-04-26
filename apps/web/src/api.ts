import type { ChangeRequest, SimulationResult, Asset, LineageEdge } from "@crashtest/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export interface MetadataContext {
  source: "openmetadata_live" | "mock" | "mock_fallback";
  assets: Asset[];
  lineage: LineageEdge[];
}

export async function fetchAssets(): Promise<Asset[]> {
  const response = await fetch(`${API_BASE}/metadata/assets`);
  if (!response.ok) {
    throw new Error("Failed to fetch assets");
  }
  return response.json() as Promise<Asset[]>;
}

export async function fetchMetadataContext(): Promise<MetadataContext> {
  const response = await fetch(`${API_BASE}/metadata/context`);
  if (!response.ok) {
    throw new Error("Failed to fetch metadata context");
  }
  return response.json() as Promise<MetadataContext>;
}

export async function runSimulation(request: ChangeRequest): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error?: string };
    throw new Error(err.error ?? "Simulation failed");
  }

  return response.json() as Promise<SimulationResult>;
}
