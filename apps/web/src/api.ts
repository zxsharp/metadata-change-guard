import type { ChangeRequest, SimulationResult, Asset } from "@crashtest/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export async function fetchAssets(): Promise<Asset[]> {
  const response = await fetch(`${API_BASE}/metadata/assets`);
  if (!response.ok) {
    throw new Error("Failed to fetch assets");
  }
  return response.json() as Promise<Asset[]>;
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
