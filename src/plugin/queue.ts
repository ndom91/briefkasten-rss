import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { queueWorker } from "./queueWorker"
import fp from "fastify-plugin"

export type Task = {
  feedUrl: string
  userId: string
}

const queue: queueAsPromised<Task> = fastq.promise(queueWorker, 1)

function queuePlugin(fastify, options, done) {
  if (!fastify.queue) {
    fastify.decorate("queue", queue);

    fastify.addHook("onClose", async (fastify, done) => {
      if (fastify.queue === queue) {
        await queue.kill()
      }
    });
  }

  done();
}

const fastifyQueuePlugin = fp(queuePlugin, { name: "fastify-queue" })

export {
  fastifyQueuePlugin as queuePlugin,
  queue
}
