// import fastify from "fastify"
import type { FastifyReply, FastifyRequest } from "fastify"
import { User } from "@auth/core/types"

declare module "fastify" {
  interface FastifyReply {
    user: User
  }
}

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => void
  }
}
