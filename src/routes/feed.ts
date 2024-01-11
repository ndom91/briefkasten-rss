import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginOptions } from 'fastify'
import { actions } from "@lib/constants"
import { postFeedSchema } from "@routes/route-schemas"

export async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get("/feed", async (_request: FastifyRequest, _reply: FastifyReply) => {
    return fastify.queue.getQueue()
  });

  fastify.post("/feed", { schema: postFeedSchema }, async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      // @ts-expect-error
      const { feedUrl, userId } = request.body;
      if (!feedUrl || !userId) {
        throw new Error("feedUrl and userId required");
      }
      await fastify.queue.push({
        // @ts-expect-error
        action: actions.ADD_FEED,
        data: {
          feedUrl,
          userId,
        }
      });
      return { type: "success" };
    } catch (error) {
      console.log(error);
      return { type: "error", error };
    }
  });
}
