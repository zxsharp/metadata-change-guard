import type { SimulationResult } from "@crashtest/shared";
import type { CSSProperties } from "react";

interface RiskSummaryProps {
  result: SimulationResult;
}

const decisionCopy: Record<SimulationResult["policyDecision"], string> = {
  allow: "Safe to proceed with standard release controls.",
  guarded: "Proceed only with owner notification and validation guardrails.",
  block: "Do not ship until downstream impact is remediated.",
};

export function RiskSummary({ result }: RiskSummaryProps) {
  return (
    <section className={`panel risk-panel decision-${result.policyDecision}`}>
      <div className="risk-score">
        <div>
          <p className="eyebrow">Simulation decision</p>
          <h2>{result.policyDecision}</h2>
          <p>{decisionCopy[result.policyDecision]}</p>
        </div>
        <div
          className="score-meter"
          style={{ "--score": `${result.riskScore}%` } as CSSProperties}
          aria-label={`Risk score ${result.riskScore}`}
        >
          <span>{result.riskScore}</span>
          <small>{result.riskLevel} risk</small>
        </div>
      </div>

      <div className="result-grid">
        <div>
          <h3>Why this decision</h3>
          <ul className="clean-list">
            {result.explanations.map((explanation) => (
              <li key={explanation}>{explanation}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recommended actions</h3>
          <ul className="clean-list">
            {result.recommendedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
