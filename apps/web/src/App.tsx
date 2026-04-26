import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAssets, runSimulation } from "./api";
import { ChangeForm } from "./components/ChangeForm";
import { RiskSummary } from "./components/RiskSummary";
import { ImpactTable } from "./components/ImpactTable";
import type { ChangeRequest } from "@crashtest/shared";

export function App() {
  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const simulationMutation = useMutation({
    mutationFn: (payload: ChangeRequest) => runSimulation(payload),
  });

  const assets = assetsQuery.data ?? [];
  const ownerCount = new Set(assets.map((asset) => asset.owner).filter(Boolean)).size;
  const tagCount = assets.reduce((count, asset) => count + asset.tags.length, 0);
  const criticalCount = assets.filter((asset) => asset.criticality === "high").length;

  return (
    <main style={{ maxWidth: "960px", margin: "2rem auto", fontFamily: "ui-sans-serif, sans-serif" }}>
      <h1>Metadata Change Guard</h1>
      <p>Run pre-deploy metadata simulations against OpenMetadata context.</p>

      {assetsQuery.isLoading && <p>Loading assets...</p>}
      {assetsQuery.error && <p>Failed to load assets.</p>}

      {assets.length > 0 ? (
        <section>
          <h3>OpenMetadata Signals</h3>
          <p>
            Loaded {assets.length} assets, {ownerCount} owners, {tagCount} governance tags, and{" "}
            {criticalCount} critical assets.
          </p>
        </section>
      ) : null}

      {assets.length > 0 ? (
        <ChangeForm
          assets={assets}
          loading={simulationMutation.isPending}
          onSubmit={(payload) => simulationMutation.mutate(payload)}
        />
      ) : null}

      {simulationMutation.error ? <p>{simulationMutation.error.message}</p> : null}

      {simulationMutation.data ? (
        <>
          <RiskSummary result={simulationMutation.data} />
          <ImpactTable impactedAssets={simulationMutation.data.impactedAssets} />
        </>
      ) : null}
    </main>
  );
}
