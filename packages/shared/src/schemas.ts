import { z } from "zod";

export const changeTypeSchema = z.enum([
  "add_column",
  "rename_column",
  "drop_column",
  "type_change",
]);

export const releaseWindowSchema = z.enum(["business_hours", "off_hours"]);

export const changeRequestSchema = z.object({
  entityId: z.string().min(1),
  changeType: changeTypeSchema,
  columns: z.array(z.string().min(1)).default([]),
  releaseWindow: releaseWindowSchema,
});

export const assetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  domain: z.string(),
  owner: z.string(),
  criticality: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string()),
  qualityStatus: z.enum(["pass", "fail", "unknown"]),
  freshnessMinutes: z.number().int().nonnegative(),
});

export const lineageEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  transformation: z.string(),
});

export const metadataSchema = z.object({
  assets: z.array(assetSchema),
  lineage: z.array(lineageEdgeSchema),
});

export type ChangeRequestInput = z.infer<typeof changeRequestSchema>;
