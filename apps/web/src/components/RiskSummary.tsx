import type { SimulationResult } from "@crashtest/shared";

interface RiskSummaryProps {
  result: SimulationResult;
}

export function RiskSummary({ result }: RiskSummaryProps) {
  return (
    <section>
      <h3>Risk Summary</h3>
      <p>
        Score: <strong>{result.riskScore}</strong>
      </p>
      <p>
        Level: <strong>{result.riskLevel}</strong>
      </p>
      <p>
        Decision: <strong>{result.policyDecision}</strong>
      </p>
      <h4>Explanations</h4>
      <ul>
        {result.explanations.map((explanation) => (
          <li key={explanation}>{explanation}</li>
        ))}
      </ul>
      <h4>Recommended Actions</h4>
      <ul>
        {result.recommendedActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </section>
  );
}
