import type { ImpactedAsset } from "@crashtest/shared";

interface ImpactTableProps {
  impactedAssets: ImpactedAsset[];
}

export function ImpactTable({ impactedAssets }: ImpactTableProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Blast radius</p>
          <h2>Impacted downstream assets</h2>
        </div>
        <span className="count-pill">{impactedAssets.length} impacted</span>
      </div>

      {impactedAssets.length === 0 ? (
        <p className="empty-state">
          No downstream assets were found for this proposed change. The release can use the standard
          checklist unless additional business context is known outside metadata.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Domain</th>
                <th>Owner</th>
                <th>Severity</th>
                <th>Risk drivers</th>
              </tr>
            </thead>
            <tbody>
              {impactedAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <strong>{asset.name}</strong>
                    <span>{asset.type}</span>
                  </td>
                  <td>{asset.domain}</td>
                  <td>{asset.owner}</td>
                  <td>
                    <span className={`severity severity-${asset.impactSeverity}`}>
                      {asset.impactSeverity}
                    </span>
                  </td>
                  <td>{asset.reasons.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
