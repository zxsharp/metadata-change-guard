import type { FastifyInstance } from "fastify";
import { OpenMetadataClient } from "@crashtest/openmetadata-client";

export async function metadataRoutes(server: FastifyInstance) {
  server.get("/metadata/assets", async (_request, reply) => {
    const client = new OpenMetadataClient();
    const metadata = await client.getMetadataSnapshot();
    return reply.send(metadata.assets);
  });

  server.get("/metadata/context", async (_request, reply) => {
    const client = new OpenMetadataClient();
    const snapshot = await client.getMetadataSnapshotWithSource();

    return reply.send({
      source: snapshot.source,
      assets: snapshot.metadata.assets,
      lineage: snapshot.metadata.lineage,
    });
  });
}
