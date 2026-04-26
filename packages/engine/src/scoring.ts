import type { Asset, ChangeRequest, PolicyDecision, RiskLevel } from "@crashtest/shared";

const baseScoreByChangeType: Record<ChangeRequest["changeType"], number> = {
  add_column: 8,
  rename_column: 25,
  drop_column: 40,
  type_change: 35,
};

export function calculateRiskScore(
  request: ChangeRequest,
  sourceAsset: Asset,
  impactedAssets: Asset[]
): number {
  let score = baseScoreByChangeType[request.changeType];

  score += Math.min(20, impactedAssets.length * 5);

  const criticalImpactedCount = impactedAssets.filter((asset) => asset.criticality === "high").length;
  score += Math.min(24, criticalImpactedCount * 8);

  const hasSensitiveTag = sourceAsset.tags.some((tag) => /pii|sensitive|restricted/i.test(tag));
  if (hasSensitiveTag) {
    score += 10;
  }

  const hasFailingQuality = impactedAssets.some((asset) => asset.qualityStatus === "fail");
  if (hasFailingQuality) {
    score += 8;
  }

  const hasStaleCritical = impactedAssets.some(
    (asset) => asset.criticality === "high" && asset.freshnessMinutes > 180
  );
  if (hasStaleCritical) {
    score += 6;
  }

  if (request.releaseWindow === "business_hours") {
    score += 6;
  }

  return Math.max(0, Math.min(100, score));
}

export function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function derivePolicyDecision(score: number): PolicyDecision {
  if (score >= 70) return "block";
  if (score >= 35) return "guarded";
  return "allow";
}
