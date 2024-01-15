import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

export default async (fastify: FastifyInstance) => {
  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      reply.type("text/html").send(
        `
        <h1>Profile</h1>
        <pre>${JSON.stringify(reply.user?.name, null, 2)}</pre>
        <a href="/">Home</a>
    `,
      )
    },
  )
}
