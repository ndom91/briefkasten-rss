import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export function routes(fastify: FastifyInstance, options) {
  const feedBodySchema = {
    type: 'object',
    required: ['feedUrl', 'userId'],
    properties: {
      feedUrl: { type: 'string' },
      userId: { type: 'string' },
    },
  }

  const schema = {
    body: feedBodySchema,
  }

  fastify.get("/feed", async (_request: FastifyRequest, _reply: FastifyReply) => {
    return fastify.queue.getQueue()
  });

  fastify.post("/feed", { schema }, async (request: FastifyRequest, _reply: FastifyReply) => {
    const { feedUrl, userId } = request.body;
    try {
      if (!feedUrl || !userId) {
        throw new Error("feedUrl required");
      }
      await fastify.queue.push({
        feedUrl,
        userId,
      });
      console.log(`Enqueued feed - ${feedUrl}`);
      return { type: "success" };
    } catch (error) {
      console.log(error);
      return { type: "error", error };
    }
  });
}
