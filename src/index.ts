import Fastify from "fastify";
import { routes as feedRoutes } from "@routes/feed";
import { updateJob } from "@jobs/cron-update"
import prismaPlugin from "@plugin/db";
import queuePlugin from "@plugin/queue";

const fastify = Fastify({ logger: { level: 'warn' } });

fastify.register(feedRoutes);
fastify.register(prismaPlugin);
fastify.register(queuePlugin);

(async function() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8000
  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`
  🚀 Server ready at: http://0.0.0.0:${port}
  ⌛ Next cron run at: ${updateJob.nextRun()}
  `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
