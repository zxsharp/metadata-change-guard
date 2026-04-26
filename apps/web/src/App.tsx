import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchMetadataContext, runSimulation } from "./api";
import { ChangeForm } from "./components/ChangeForm";
import { RiskSummary } from "./components/RiskSummary";
import { ImpactTable } from "./components/ImpactTable";
import type { Asset, ChangeRequest, LineageEdge } from "@crashtest/shared";

const sourceLabels = {
  openmetadata_live: "OpenMetadata live",
  mock: "OpenMetadata-shaped demo dataset",
  mock_fallback: "Demo fallback after live OpenMetadata request failed",
};

function countOwners(assets: Asset[]) {
  return new Set(assets.map((asset) => asset.owner).filter(Boolean)).size;
}

function countTags(assets: Asset[]) {
  return assets.reduce((count, asset) => count + asset.tags.length, 0);
}

function buildLineagePreview(lineage: LineageEdge[], assets: Asset[]) {
  const names = new Map(assets.map((asset) => [asset.id, asset.name]));
  return lineage.map((edge) => ({
    ...edge,
    fromName: names.get(edge.from) ?? edge.from,
    toName: names.get(edge.to) ?? edge.to,
  }));
}

function criticalityClass(asset: Asset) {
  if (asset.criticality === "high") return "tag-red";
  if (asset.criticality === "medium") return "tag-blue";
  return "tag-green";
}

function qualityClass(asset: Asset) {
  if (asset.qualityStatus === "fail") return "tag-red";
  if (asset.qualityStatus === "pass") return "tag-green";
  return "tag-muted";
}

export function App() {
  const metadataQuery = useQuery({
    queryKey: ["metadata-context"],
    queryFn: fetchMetadataContext,
  });

  const simulationMutation = useMutation({
    mutationFn: (payload: ChangeRequest) => runSimulation(payload),
  });

  const metadata = metadataQuery.data;
  const assets = metadata?.assets ?? [];
  const lineage = metadata?.lineage ?? [];
  const criticalCount = assets.filter((asset) => asset.criticality === "high").length;
  const failingQualityCount = assets.filter((asset) => asset.qualityStatus === "fail").length;
  const lineagePreview = buildLineagePreview(lineage, assets);

  return (
    <main>
      <nav className="topbar" aria-label="Product navigation">
        <div className="brand-mark">MCG</div>
        <div>
          <strong>Metadata Change Guard</strong>
          <span>OpenMetadata release safety</span>
        </div>
        <a href="#dashboard">Run simulation</a>
      </nav>

      <section className="hero">
        <div className="hero-copy-block">
          <p className="eyebrow">OpenMetadata-powered data release gate</p>
          <h1>Catch risky schema changes before they hit production.</h1>
          <p className="hero-copy">
            Metadata Change Guard turns catalog metadata into a pre-deploy decision system. It
            reads lineage, owners, tags, domains, freshness, and quality context, then explains
            whether a proposed data contract change should be allowed, guarded, or blocked.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#dashboard">
              Open dashboard
            </a>
            <a className="secondary-link" href="#metadata">
              Review metadata signals
            </a>
          </div>
        </div>
        <div className="hero-preview" aria-label="Decision preview">
          <div className="preview-header">
            <span>Release check</span>
            <strong>drop customer_email</strong>
          </div>
          <div className="preview-decision">
            <small>Policy</small>
            <strong>block</strong>
          </div>
          <div className="preview-row">
            <span>Downstream assets</span>
            <strong>3</strong>
          </div>
          <div className="preview-row">
            <span>Critical owners</span>
            <strong>team-finance, team-bi</strong>
          </div>
          <div className="preview-tags">
            <span className="tag tag-red">PII</span>
            <span className="tag tag-red">Breaking change</span>
            <span className="tag tag-blue">Lineage impact</span>
          </div>
        </div>
      </section>

      {metadataQuery.isLoading ? <section className="panel">Loading metadata context...</section> : null}
      {metadataQuery.error ? (
        <section className="panel error-panel">Failed to load metadata context from the API.</section>
      ) : null}

      {metadata ? (
        <>
          <section className="status-strip" aria-label="Metadata status">
            <div className="status-source">
              <span className={`source-dot source-${metadata.source}`} />
              <div>
                <p>Metadata source</p>
                <strong>{sourceLabels[metadata.source]}</strong>
              </div>
            </div>
            <div>
              <span>{assets.length}</span>
              <p>assets</p>
            </div>
            <div>
              <span>{lineage.length}</span>
              <p>lineage edges</p>
            </div>
            <div>
              <span>{countOwners(assets)}</span>
              <p>owners</p>
            </div>
            <div>
              <span>{countTags(assets)}</span>
              <p>governance tags</p>
            </div>
          </section>

          <section id="dashboard" className="dashboard-shell">
            <div className="dashboard-header">
              <div>
                <p className="eyebrow">Working dashboard</p>
                <h2>Simulate a proposed contract change</h2>
              </div>
              <div className="signal-summary">
                <span className="tag tag-red">{criticalCount} critical assets</span>
                <span className={failingQualityCount > 0 ? "tag tag-red" : "tag tag-green"}>
                  {failingQualityCount} failing quality signals
                </span>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="workspace-main">
                <ChangeForm
                  assets={assets}
                  loading={simulationMutation.isPending}
                  onSubmit={(payload) => simulationMutation.mutate(payload)}
                />

                {simulationMutation.error ? (
                  <section className="panel error-panel">{simulationMutation.error.message}</section>
                ) : null}

                {simulationMutation.data ? (
                  <div className="workspace-results">
                    <RiskSummary result={simulationMutation.data} />
                    <ImpactTable impactedAssets={simulationMutation.data.impactedAssets} />
                  </div>
                ) : (
                  <section className="empty-workspace">
                    <strong>No simulation run yet</strong>
                    <span>Select a scenario or edit the change request, then run the metadata check.</span>
                  </section>
                )}
              </div>

              <aside className="dashboard-sidebar">
                <section className="side-card">
                  <p className="eyebrow">Metadata source</p>
                  <h3>{sourceLabels[metadata.source]}</h3>
                  <div className="side-stack">
                    <span className="tag tag-blue">{lineage.length} lineage edges</span>
                    <span className="tag tag-green">{countOwners(assets)} owners</span>
                    <span className="tag tag-red">{criticalCount} critical assets</span>
                    <span className={failingQualityCount > 0 ? "tag tag-red" : "tag tag-green"}>
                      {failingQualityCount} quality failures
                    </span>
                  </div>
                </section>

                <section className="side-card">
                  <div className="side-heading">
                    <p className="eyebrow">Lineage path</p>
                    <strong>{lineagePreview.length} edges</strong>
                  </div>
                  <div className="side-lineage">
                    {lineagePreview.slice(0, 5).map((edge) => (
                      <div key={`${edge.from}-${edge.to}`} className="side-lineage-row">
                        <span>{edge.fromName}</span>
                        <small>{edge.transformation}</small>
                        <span>{edge.toName}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="side-card">
                  <p className="eyebrow">Release policy</p>
                  <div className="policy-rows">
                    <div>
                      <span className="tag tag-green">0-34</span>
                      <strong>allow</strong>
                    </div>
                    <div>
                      <span className="tag tag-blue">35-69</span>
                      <strong>guarded</strong>
                    </div>
                    <div>
                      <span className="tag tag-red">70-100</span>
                      <strong>block</strong>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </section>

          <section id="metadata" className="panel table-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">OpenMetadata asset preview</p>
                <h2>Catalog context loaded into the simulator</h2>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Domain</th>
                    <th>Owner</th>
                    <th>Tags</th>
                    <th>Quality</th>
                    <th>Freshness</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <strong>{asset.name}</strong>
                        <span>{asset.id}</span>
                      </td>
                      <td>{asset.type}</td>
                      <td>{asset.domain}</td>
                      <td>{asset.owner}</td>
                      <td>
                        <span className={`tag ${criticalityClass(asset)}`}>{asset.criticality}</span>
                        {asset.tags.map((tag) => (
                          <span key={tag} className="tag tag-red">
                            {tag}
                          </span>
                        ))}
                      </td>
                      <td>
                        <span className={`tag ${qualityClass(asset)}`}>{asset.qualityStatus}</span>
                      </td>
                      <td>{asset.freshnessMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </>
      ) : null}
    </main>
  );
}
