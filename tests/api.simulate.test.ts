import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../apps/api/src/server";

describe("simulate API", () => {
  const server = buildServer();

  beforeAll(async () => {
    process.env.OPENMETADATA_MODE = "mock";
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it("returns simulation result", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/simulate",
      payload: {
        entityId: "table_sales_orders",
        changeType: "drop_column",
        columns: ["customer_email"],
        releaseWindow: "business_hours",
      },
    });

    const body = response.json();
    expect(response.statusCode).toBe(200);
    expect(body.policyDecision).toBeDefined();
    expect(body.riskScore).toBeTypeOf("number");
  });

  it("rejects invalid payload", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/simulate",
      payload: { entityId: "", changeType: "bad" },
    });

    expect(response.statusCode).toBe(400);
  });
});
