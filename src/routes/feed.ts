export function routes(fastify, options) {
  fastify.get("/feed", async (request, reply) => {
    return fastify.queue.getQueue()
  });

  fastify.post("/feed", async (request, reply) => {
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
