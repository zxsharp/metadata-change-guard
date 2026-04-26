import type { FastifyInstance } from "fastify";
import { OpenMetadataClient } from "@crashtest/openmetadata-client";

export async function metadataRoutes(server: FastifyInstance) {
  server.get("/metadata/assets", async (_request, reply) => {
    const client = new OpenMetadataClient();
    const metadata = await client.getMetadataSnapshot();
    return reply.send(metadata.assets);
  });
}
