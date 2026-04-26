import type { FastifyInstance } from "fastify";
import { changeRequestSchema } from "@crashtest/shared";
import { OpenMetadataClient } from "@crashtest/openmetadata-client";
import { simulateChange } from "@crashtest/engine";

export async function simulateRoutes(server: FastifyInstance) {
  server.post("/simulate", async (request, reply) => {
    const parsed = changeRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      });
    }

    try {
      const client = new OpenMetadataClient();
      const metadata = await client.getMetadataSnapshot();
      const result = simulateChange(parsed.data, metadata);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Simulation failed";
      return reply.status(500).send({ error: message });
    }
  });
}
