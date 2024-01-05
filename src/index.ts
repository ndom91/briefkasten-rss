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
  try {
    await fastify.listen({ port: 8000 });
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
