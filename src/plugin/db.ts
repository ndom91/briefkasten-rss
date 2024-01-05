import { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin"
const prisma = new PrismaClient();

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

const fastifyPrismaPlugin = fp(prismaPlugin, { name: "fastify-prisma" })

export {
  fastifyPrismaPlugin as prismaPlugin,
  prisma
}
