export type ChangeType = "add_column" | "rename_column" | "drop_column" | "type_change";
export type ReleaseWindow = "business_hours" | "off_hours";
export type RiskLevel = "low" | "medium" | "high";
export type PolicyDecision = "allow" | "guarded" | "block";
export type AssetCriticality = "low" | "medium" | "high";
export type QualityStatus = "pass" | "fail" | "unknown";

export interface ChangeRequest {
  entityId: string;
  changeType: ChangeType;
  columns: string[];
  releaseWindow: ReleaseWindow;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  domain: string;
  owner: string;
  criticality: AssetCriticality;
  tags: string[];
  qualityStatus: QualityStatus;
  freshnessMinutes: number;
}

export interface LineageEdge {
  from: string;
  to: string;
  transformation: string;
}

export interface NormalizedMetadata {
  assets: Asset[];
  lineage: LineageEdge[];
}

export interface ImpactedAsset {
  id: string;
  name: string;
  type: string;
  domain: string;
  owner: string;
  impactSeverity: "moderate" | "high" | "critical";
  reasons: string[];
}

export interface SimulationResult {
  riskScore: number;
  riskLevel: RiskLevel;
  policyDecision: PolicyDecision;
  impactedAssets: ImpactedAsset[];
  explanations: string[];
  recommendedActions: string[];
}
