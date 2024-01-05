import { FastifyPluginCallback } from 'fastify'
import { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin"
const prisma = new PrismaClient();

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

function prismaPlugin(fastify, options, done) {
  if (!fastify.prisma) {
    fastify.decorate("prisma", prisma);

    fastify.addHook("onClose", async (fastify, done) => {
      if (fastify.prisma === prisma) {
        await prisma.$disconnect();
      }
    });
  }

  done();
}

export const fastifyPrisma: FastifyPluginCallback = fp(prismaPlugin, { name: "fastify-prisma" })

export {
  fastifyPrisma as default,
  prisma
}
