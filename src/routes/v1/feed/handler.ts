import type { RouteHandler, FastifyRequest, FastifyReply } from "fastify"
import { actions } from "@lib/constants"

export const getQueueHandler: RouteHandler = async function (request: FastifyRequest, reply: FastifyReply) {
  const queue = request.server.queue.getQueue()
  reply.preventCache()
  return reply.send({ queue })
}

export const postFeedToQueuehandler = async function (request: FastifyRequest, reply: FastifyReply) {
  console.log("req", request)
  try {
    // @ts-expect-error body not typed correctly
    const { feedUrl, userId } = request.body
    if (!feedUrl || !userId) {
      throw reply.badRequest("feedUrl and userId required")
    }
    await request.server.queue.push({
      // @ts-expect-error action not typed correctly
      action: actions.ADD_FEED,
      data: {
        feedUrl,
        userId,
      },
    })
    return reply.send("ok")
  } catch (error) {
    console.log(error)
    // @ts-expect-error error typed unknown
    return reply.internalServerError(typeof error === "string" ? error : error.message)
  }
}
