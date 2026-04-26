import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health";
import { metadataRoutes } from "./routes/metadata";
import { simulateRoutes } from "./routes/simulate";

export function buildServer() {
  const server = Fastify({ logger: true });

  server.register(cors, {
    origin: true,
  });

  server.register(healthRoutes);
  server.register(metadataRoutes);
  server.register(simulateRoutes);

  return server;
}

async function start() {
  const server = buildServer();
  const port = Number(process.env.PORT ?? 3001);

  try {
    await server.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  void start();
}
