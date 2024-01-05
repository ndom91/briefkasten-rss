import Fastify from "fastify";
import { routes as feedRoutes } from "./routes/feed";
import { updateJob } from "./jobs/cron-update"
import prismaPlugin from "./plugin/db";
import queuePlugin from "./plugin/queue";

const fastify = Fastify({ logger: { level: 'debug' } });

fastify.register(feedRoutes);
fastify.after(err => console.log('after routes', err))
fastify.register(prismaPlugin)
fastify.after(err => console.log('after prisma', err))
fastify.register(queuePlugin)
fastify.after(err => console.log('after queue', err))

const start = async () => {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8000
  try {
    await fastify.listen({ port });
    console.log('updateJob.isRunning', updateJob.isRunning())
    console.log('updateJob.nextRun', updateJob.nextRun())
    console.log(`
    🚀 Server ready at: http://localhost:${port}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
