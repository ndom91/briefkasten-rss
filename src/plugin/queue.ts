import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { queueWorker } from "./queueWorker"
import fp from "fastify-plugin"
import type { FastifyPluginCallback, FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from 'fastify'

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

function queuePlugin(fastify: FastifyInstance, _options: FastifyPluginOptions, done: HookHandlerDoneFunction) {
  if (!fastify.queue) {
    fastify.decorate("queue", queue);

    fastify.addHook("onClose", async () => {
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
