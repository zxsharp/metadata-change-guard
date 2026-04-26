import { describe, expect, it } from "vitest";
import { simulateChange } from "../packages/engine/src/simulate";
import metadata from "../data/sample_metadata.json";
import type { ChangeRequest, NormalizedMetadata } from "../packages/shared/src/types";

describe("simulation scoring", () => {
  const snapshot = metadata as NormalizedMetadata;

  it("returns guarded or allow for low-risk change", () => {
    const payload: ChangeRequest = {
      entityId: "table_sales_order_items",
      changeType: "add_column",
      columns: ["promo_code"],
      releaseWindow: "off_hours",
    };

    const result = simulateChange(payload, snapshot);
    expect(result.policyDecision === "allow" || result.policyDecision === "guarded").toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
  });

  it("returns block for high-risk change", () => {
    const payload: ChangeRequest = {
      entityId: "table_sales_orders",
      changeType: "drop_column",
      columns: ["customer_email"],
      releaseWindow: "business_hours",
    };

    const result = simulateChange(payload, snapshot);
    expect(result.policyDecision).toBe("block");
    expect(result.riskScore).toBeGreaterThanOrEqual(70);
  });
});
