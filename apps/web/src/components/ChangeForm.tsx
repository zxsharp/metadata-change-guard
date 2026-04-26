import { useEffect, useState } from "react";
import type { Asset, ChangeRequest, ChangeType, ReleaseWindow } from "@crashtest/shared";

interface ChangeFormProps {
  assets: Asset[];
  onSubmit: (payload: ChangeRequest) => void;
  loading?: boolean;
}

const changeTypes: ChangeType[] = ["add_column", "rename_column", "drop_column", "type_change"];
const releaseWindows: ReleaseWindow[] = ["business_hours", "off_hours"];

export function ChangeForm({ assets, onSubmit, loading = false }: ChangeFormProps) {
  const defaultEntity = assets[0]?.id ?? "";
  const [entityId, setEntityId] = useState(defaultEntity);
  const [changeType, setChangeType] = useState<ChangeType>("drop_column");
  const [columns, setColumns] = useState("customer_email");
  const [releaseWindow, setReleaseWindow] = useState<ReleaseWindow>("business_hours");

  useEffect(() => {
    if (!entityId && defaultEntity) {
      setEntityId(defaultEntity);
    }
  }, [defaultEntity, entityId]);

  return (
    <form
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
      style={{ display: "grid", gap: "0.75rem" }}
    >
      <label>
        Entity
        <select value={entityId} onChange={(event) => setEntityId(event.target.value)} required>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Change Type
        <select
          value={changeType}
          onChange={(event) => setChangeType(event.target.value as ChangeType)}
        >
          {changeTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label>
        Columns (comma-separated)
        <input value={columns} onChange={(event) => setColumns(event.target.value)} />
      </label>

      <label>
        Release Window
        <select
          value={releaseWindow}
          onChange={(event) => setReleaseWindow(event.target.value as ReleaseWindow)}
        >
          {releaseWindows.map((window) => (
            <option key={window} value={window}>
              {window}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={loading || !entityId}>
        {loading ? "Running..." : "Run Simulation"}
      </button>
    </form>
  );
}
