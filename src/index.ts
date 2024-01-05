import Fastify from "fastify";
import { routes as feedRoutes } from "./routes/feed";
import { updateJob } from "./jobs/update"
import { prismaPlugin } from "./plugin/db";

const fastify = Fastify({ logger: true });

fastify.register(feedRoutes);
fastify.register(prismaPlugin)

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('updateJob.isRunning', updateJob.isRunning())
    console.log(`
    🚀 Server ready at: http://localhost:3000
    ⭐️ See sample requests: http://pris.ly/e/ts/rest-fastify#3-using-the-rest-api`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
