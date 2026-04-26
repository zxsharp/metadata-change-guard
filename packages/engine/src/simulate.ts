import type {
  Asset,
  ChangeRequest,
  ImpactedAsset,
  NormalizedMetadata,
  SimulationResult,
} from "@crashtest/shared";
import { collectDownstream } from "./graph";
import { buildRecommendations } from "./recommend";
import { calculateRiskScore, derivePolicyDecision, deriveRiskLevel } from "./scoring";

function getImpactSeverity(asset: Asset): ImpactedAsset["impactSeverity"] {
  if (asset.criticality === "high") return "critical";
  if (asset.criticality === "medium") return "high";
  return "moderate";
}

function buildReasons(request: ChangeRequest, asset: Asset): string[] {
  const reasons = ["depends_on_changed_entity"];

  if (request.changeType === "drop_column" || request.changeType === "type_change") {
    reasons.push("schema_breaking_change");
  }
  if (asset.criticality === "high") {
    reasons.push("high_business_criticality");
  }
  if (asset.qualityStatus === "fail") {
    reasons.push("existing_quality_failure");
  }

  return reasons;
}

export function simulateChange(
  request: ChangeRequest,
  metadata: NormalizedMetadata
): SimulationResult {
  const sourceAsset = metadata.assets.find((asset) => asset.id === request.entityId);
  if (!sourceAsset) {
    throw new Error(`Source entity not found: ${request.entityId}`);
  }

  const downstreamIds = collectDownstream(request.entityId, metadata.lineage);
  const impactedAssetsRaw = metadata.assets.filter((asset) => downstreamIds.includes(asset.id));

  const riskScore = calculateRiskScore(request, sourceAsset, impactedAssetsRaw);
  const riskLevel = deriveRiskLevel(riskScore);
  const policyDecision = derivePolicyDecision(riskScore);

  const impactedAssets: ImpactedAsset[] = impactedAssetsRaw.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    domain: asset.domain,
    owner: asset.owner,
    impactSeverity: getImpactSeverity(asset),
    reasons: buildReasons(request, asset),
  }));

  const criticalCount = impactedAssetsRaw.filter((asset) => asset.criticality === "high").length;
  const explanations = [
    `Change affects ${impactedAssetsRaw.length} downstream assets.`,
    `${criticalCount} impacted assets are business-critical.`,
    `Operation ${request.changeType} during ${request.releaseWindow} increases rollout risk.`,
  ];

  const recommendedActions = buildRecommendations(request, policyDecision, impactedAssetsRaw);

  return {
    riskScore,
    riskLevel,
    policyDecision,
    impactedAssets,
    explanations,
    recommendedActions,
  };
}
