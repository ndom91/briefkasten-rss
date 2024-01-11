import type { FastifyZod } from "fastify-zod";
import { FeedSchema } from "./src/lib/types/index.ts";

const models = {
  FeedSchema,
};

// Global augmentation, as suggested by
// https://www.fastify.io/docs/latest/Reference/TypeScript/#creating-a-typescript-fastify-plugin
declare module "fastify" {
  interface FastifyInstance {
    readonly zod: FastifyZod<typeof models>;
  }
}
