import type { Asset, LineageEdge, NormalizedMetadata } from "@crashtest/shared";

interface MockMetadataFile {
  assets: Asset[];
  lineage: LineageEdge[];
}

export function normalizeMockMetadata(fileData: MockMetadataFile): NormalizedMetadata {
  return {
    assets: fileData.assets,
    lineage: fileData.lineage,
  };
}
