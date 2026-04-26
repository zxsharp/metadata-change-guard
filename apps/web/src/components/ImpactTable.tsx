import type { ImpactedAsset } from "@crashtest/shared";

interface ImpactTableProps {
  impactedAssets: ImpactedAsset[];
}

export function ImpactTable({ impactedAssets }: ImpactTableProps) {
  return (
    <section>
      <h3>Impacted Assets</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Domain</th>
            <th>Owner</th>
            <th>Severity</th>
            <th>Reasons</th>
          </tr>
        </thead>
        <tbody>
          {impactedAssets.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.name}</td>
              <td>{asset.domain}</td>
              <td>{asset.owner}</td>
              <td>{asset.impactSeverity}</td>
              <td>{asset.reasons.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
