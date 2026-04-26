import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Asset, AssetCriticality, LineageEdge, NormalizedMetadata } from "@crashtest/shared";
import { metadataSchema } from "@crashtest/shared";
import { endpoints } from "./endpoints";
import { normalizeMockMetadata } from "./mapper";

export interface OpenMetadataClientConfig {
  mode?: "live" | "mock";
  baseUrl?: string;
  jwtToken?: string;
  mockFilePath?: string;
  allowFallback?: boolean;
}

export type MetadataSnapshotSource = "openmetadata_live" | "mock" | "mock_fallback";

export interface MetadataSnapshotWithSource {
  metadata: NormalizedMetadata;
  source: MetadataSnapshotSource;
}

export class OpenMetadataClient {
  private readonly mode: "live" | "mock";
  private readonly baseUrl?: string;
  private readonly jwtToken?: string;
  private readonly mockFilePath: string;
  private readonly allowFallback: boolean;

  constructor(config: OpenMetadataClientConfig = {}) {
    this.mode = config.mode ?? (process.env.OPENMETADATA_MODE as "live" | "mock") ?? "mock";
    this.baseUrl = config.baseUrl ?? process.env.OPENMETADATA_BASE_URL;
    this.jwtToken = config.jwtToken ?? process.env.OPENMETADATA_JWT_TOKEN;
    this.mockFilePath = config.mockFilePath ?? resolveMockFilePath();
    this.allowFallback =
      config.allowFallback ??
      (process.env.OPENMETADATA_ALLOW_FALLBACK
        ? process.env.OPENMETADATA_ALLOW_FALLBACK === "true"
        : this.mode !== "live");

    if (this.mode === "live" && (!this.baseUrl || !this.jwtToken)) {
      throw new Error(
        "OPENMETADATA_MODE=live requires OPENMETADATA_BASE_URL and OPENMETADATA_JWT_TOKEN"
      );
    }
  }

  async getMetadataSnapshot(): Promise<NormalizedMetadata> {
    const snapshot = await this.getMetadataSnapshotWithSource();
    return snapshot.metadata;
  }

  async getMetadataSnapshotWithSource(): Promise<MetadataSnapshotWithSource> {
    if (this.mode === "live") {
      return this.getLiveMetadata();
    }

    return {
      metadata: await this.getMockMetadata(),
      source: "mock",
    };
  }

  private async getMockMetadata(): Promise<NormalizedMetadata> {
    const raw = await readFile(this.mockFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    const validated = metadataSchema.parse(parsed);
    return normalizeMockMetadata(validated);
  }

  private async getLiveMetadata(): Promise<MetadataSnapshotWithSource> {
    try {
      const tablePayload = await this.fetchOpenMetadata<{ data?: unknown[] }>(endpoints.searchTables);
      const assets = new Map<string, Asset>();
      const lineage = new Map<string, LineageEdge>();

      for (const table of tablePayload.data ?? []) {
        const asset = normalizeOpenMetadataAsset(asRecord(table), "table");
        if (asset) {
          assets.set(asset.id, asset);
        }
      }

      for (const asset of [...assets.values()]) {
        const lineagePayload = await this.fetchOptionalOpenMetadata<unknown>(
          endpoints.lineageByEntity(asset.id)
        );

        if (!lineagePayload) continue;

        for (const lineageAsset of extractLineageAssets(lineagePayload)) {
          assets.set(lineageAsset.id, lineageAsset);
        }

        for (const edge of extractLineageEdges(lineagePayload)) {
          lineage.set(`${edge.from}->${edge.to}`, edge);
        }
      }

      const normalized = {
        assets: [...assets.values()].sort((left, right) => left.name.localeCompare(right.name)),
        lineage: [...lineage.values()].sort((left, right) =>
          `${left.from}:${left.to}`.localeCompare(`${right.from}:${right.to}`)
        ),
      };

      return {
        metadata: metadataSchema.parse(normalized),
        source: "openmetadata_live",
      };
    } catch (error) {
      if (!this.allowFallback) {
        const message = error instanceof Error ? error.message : "Unknown OpenMetadata error";
        throw new Error(`OpenMetadata live mode failed: ${message}`);
      }

      return {
        metadata: await this.getMockMetadata(),
        source: "mock_fallback",
      };
    }
  }

  private async fetchOpenMetadata<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.jwtToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`OpenMetadata request failed for ${path}: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private async fetchOptionalOpenMetadata<T>(path: string): Promise<T | null> {
    try {
      return await this.fetchOpenMetadata<T>(path);
    } catch {
      return null;
    }
  }
}

function resolveMockFilePath(): string {
  const candidates = [
    resolve(process.cwd(), "data", "sample_metadata.json"),
    resolve(process.cwd(), "..", "..", "data", "sample_metadata.json"),
    resolve(process.cwd(), "..", "data", "sample_metadata.json"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readNestedString(value: unknown, keys: string[]): string | undefined {
  const record = asRecord(value);
  for (const key of keys) {
    const candidate = readString(record[key]);
    if (candidate) return candidate;
  }
  return undefined;
}

function readEntityId(value: unknown): string | undefined {
  const record = asRecord(value);
  return (
    readString(record.id) ??
    readNestedString(record.entity, ["id"]) ??
    readNestedString(record.fromEntity, ["id"]) ??
    readNestedString(record.toEntity, ["id"])
  );
}

function readEntityName(value: unknown): string {
  return readOptionalEntityName(value) ?? "unknown";
}

function readOptionalEntityName(value: unknown): string | undefined {
  const record = asRecord(value);
  return (
    readString(record.fullyQualifiedName) ??
    readString(record.name) ??
    readNestedString(record.entity, ["fullyQualifiedName", "name"])
  );
}

function readEntityType(value: unknown, fallback: string): string {
  const record = asRecord(value);
  return readString(record.entityType) ?? readString(record.type) ?? fallback;
}

function normalizeOwner(value: unknown): string {
  const record = asRecord(value);
  const owner = asRecord(record.owner);
  return readString(owner.name) ?? readString(owner.displayName) ?? "unassigned";
}

function normalizeDomain(value: unknown): string {
  const record = asRecord(value);
  const domains = Array.isArray(record.domains) ? record.domains : [];
  const firstDomain = domains[0];

  if (typeof firstDomain === "string") {
    return firstDomain;
  }

  if (firstDomain) {
    return readEntityName(firstDomain);
  }

  return "Unknown";
}

function normalizeTags(value: unknown): string[] {
  const tags = asRecord(value).tags;
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (typeof tag === "string") return tag;
      const record = asRecord(tag);
      return readString(record.tagFQN) ?? readString(record.name) ?? readString(record.labelType);
    })
    .filter((tag): tag is string => Boolean(tag));
}

function deriveCriticality(tags: string[]): AssetCriticality {
  if (tags.some((tag) => /critical|tier\.?1|gold/i.test(tag))) return "high";
  if (tags.some((tag) => /important|tier\.?2|silver/i.test(tag))) return "medium";
  return "medium";
}

function normalizeOpenMetadataAsset(value: unknown, fallbackType: string): Asset | null {
  const id = readEntityId(value);
  if (!id) return null;

  const tags = normalizeTags(value);
  return {
    id,
    name: readEntityName(value),
    type: readEntityType(value, fallbackType),
    domain: normalizeDomain(value),
    owner: normalizeOwner(value),
    criticality: deriveCriticality(tags),
    tags,
    qualityStatus: "unknown",
    freshnessMinutes: 60,
  };
}

function extractLineageAssets(payload: unknown): Asset[] {
  const record = asRecord(payload);
  const nodes = Array.isArray(record.nodes) ? record.nodes : [];
  const entity = record.entity ? [record.entity] : [];

  return [...entity, ...nodes]
    .map((node) => normalizeOpenMetadataAsset(node, "asset"))
    .filter((asset): asset is Asset => Boolean(asset));
}

function extractLineageEdges(payload: unknown): LineageEdge[] {
  const record = asRecord(payload);
  const candidates = [
    ...(Array.isArray(record.downstreamEdges) ? record.downstreamEdges : []),
    ...(Array.isArray(record.upstreamEdges) ? record.upstreamEdges : []),
    ...(Array.isArray(record.edges) ? record.edges : []),
  ];

  return candidates
    .map((edge) => {
      const edgeRecord = asRecord(edge);
      const from =
        readString(edgeRecord.fromEntity) ??
        readEntityId(edgeRecord.fromEntity) ??
        readString(edgeRecord.from) ??
        readEntityId(edgeRecord.from);
      const to =
        readString(edgeRecord.toEntity) ??
        readEntityId(edgeRecord.toEntity) ??
        readString(edgeRecord.to) ??
        readEntityId(edgeRecord.to);

      if (!from || !to) return null;

      return {
        from,
        to,
        transformation:
          readString(edgeRecord.pipeline) ??
          readOptionalEntityName(edgeRecord.pipeline) ??
          "openmetadata_lineage",
      };
    })
    .filter((edge): edge is LineageEdge => Boolean(edge));
}
