import { useEffect, useMemo, useState } from "react";
import type { Asset, ChangeRequest, ChangeType, ReleaseWindow } from "@crashtest/shared";

interface ChangeFormProps {
  assets: Asset[];
  onSubmit: (payload: ChangeRequest) => void;
  loading?: boolean;
}

const changeTypes: Array<{ value: ChangeType; label: string; detail: string }> = [
  { value: "drop_column", label: "Drop column", detail: "Breaking change" },
  { value: "type_change", label: "Change type", detail: "Compatibility risk" },
  { value: "rename_column", label: "Rename column", detail: "Consumer migration" },
  { value: "add_column", label: "Add column", detail: "Usually safe" },
];

const releaseWindows: Array<{ value: ReleaseWindow; label: string }> = [
  { value: "business_hours", label: "Business hours" },
  { value: "off_hours", label: "Off hours" },
];

export function ChangeForm({ assets, onSubmit, loading = false }: ChangeFormProps) {
  const defaultEntity = useMemo(
    () => assets.find((asset) => asset.id === "table_sales_orders")?.id ?? assets[0]?.id ?? "",
    [assets]
  );
  const [entityId, setEntityId] = useState(defaultEntity);
  const [changeType, setChangeType] = useState<ChangeType>("drop_column");
  const [columns, setColumns] = useState("customer_email");
  const [releaseWindow, setReleaseWindow] = useState<ReleaseWindow>("business_hours");

  useEffect(() => {
    if (!entityId && defaultEntity) {
      setEntityId(defaultEntity);
    }
  }, [defaultEntity, entityId]);

  const selectedAsset = assets.find((asset) => asset.id === entityId);

  function applyScenario(scenario: "safe" | "risky") {
    if (scenario === "safe") {
      const safeAsset = assets.find((asset) => asset.id === "table_sales_order_items") ?? assets[0];
      setEntityId(safeAsset?.id ?? "");
      setChangeType("add_column");
      setColumns("promo_code");
      setReleaseWindow("off_hours");
      return;
    }

    const riskyAsset = assets.find((asset) => asset.id === "table_sales_orders") ?? assets[0];
    setEntityId(riskyAsset?.id ?? "");
    setChangeType("drop_column");
    setColumns("customer_email");
    setReleaseWindow("business_hours");
  }

  return (
    <section className="simulation-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Simulation input</p>
          <h3>Proposed contract change</h3>
        </div>
        <div className="scenario-actions" aria-label="Demo scenarios">
          <button type="button" className="secondary-button green-button" onClick={() => applyScenario("safe")}>
            Low-risk scenario
          </button>
          <button type="button" className="secondary-button red-button" onClick={() => applyScenario("risky")}>
            High-risk scenario
          </button>
        </div>
      </div>

      <form
        className="change-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            entityId,
            changeType,
            columns: columns
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            releaseWindow,
          });
        }}
      >
        <label>
          <span>OpenMetadata asset</span>
          <select value={entityId} onChange={(event) => setEntityId(event.target.value)} required>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} · {asset.type} · {asset.owner}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Change type</span>
          <select
            value={changeType}
            onChange={(event) => setChangeType(event.target.value as ChangeType)}
          >
            {changeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.detail}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Affected columns</span>
          <input value={columns} onChange={(event) => setColumns(event.target.value)} />
        </label>

        <label>
          <span>Release window</span>
          <select
            value={releaseWindow}
            onChange={(event) => setReleaseWindow(event.target.value as ReleaseWindow)}
          >
            {releaseWindows.map((window) => (
              <option key={window.value} value={window.value}>
                {window.label}
              </option>
            ))}
          </select>
        </label>

        {selectedAsset ? (
          <div className="selected-asset">
            <strong>{selectedAsset.name}</strong>
            <span>{selectedAsset.domain}</span>
            <span>{selectedAsset.owner}</span>
            <span>{selectedAsset.criticality} criticality</span>
            <span>{selectedAsset.tags.length > 0 ? selectedAsset.tags.join(", ") : "no tags"}</span>
          </div>
        ) : null}

        <button className="primary-button" type="submit" disabled={loading || !entityId}>
          {loading ? "Running simulation..." : "Run metadata simulation"}
        </button>
      </form>
    </section>
  );
}
