import type { LineageEdge } from "@crashtest/shared";

export function collectDownstream(entityId: string, lineage: LineageEdge[]): string[] {
  const adjacency = new Map<string, string[]>();

  for (const edge of lineage) {
    const existing = adjacency.get(edge.from) ?? [];
    existing.push(edge.to);
    adjacency.set(edge.from, existing);
  }

  const visited = new Set<string>();
  const queue: string[] = [entityId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const neighbors = adjacency.get(current) ?? [];
    for (const node of neighbors) {
      if (!visited.has(node)) {
        visited.add(node);
        queue.push(node);
      }
    }
  }

  return [...visited];
}
