import type { Asset, ChangeRequest, PolicyDecision } from "@crashtest/shared";

export function buildRecommendations(
  request: ChangeRequest,
  decision: PolicyDecision,
  impactedAssets: Asset[]
): string[] {
  const recommendations: string[] = [];

  if (request.changeType === "drop_column" || request.changeType === "type_change") {
    recommendations.push("Create compatibility view for at least one release window.");
  }

  if (impactedAssets.length > 0) {
    recommendations.push("Notify impacted owners with migration ETA and fallback details.");
  }

  if (impactedAssets.some((asset) => asset.qualityStatus === "fail")) {
    recommendations.push("Run quality checks in canary before full rollout.");
  }

  if (decision === "block") {
    recommendations.push("Delay deployment until high-impact dependencies are remediated.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Proceed with standard release checklist and post-deploy monitoring.");
  }

  return recommendations;
}
