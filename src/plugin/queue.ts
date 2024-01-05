import { FastifyPluginCallback } from 'fastify'
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { queueWorker } from "./queueWorker"
import fp from "fastify-plugin"

declare module 'fastify' {
  interface FastifyInstance {
    queue: queueAsPromised<Task>
  }
}

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

const fastifyQueue: FastifyPluginCallback = fp(queuePlugin, { name: "fastify-queue" })

export {
  fastifyQueue as default,
  queue
}
