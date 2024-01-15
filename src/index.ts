import Fastify from "fastify"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { updateJob } from "@jobs/cron-update"
import autoLoad from "@fastify/autoload"
import formbodyParser from "@fastify/formbody"
// import httpProxy from "@fastify/http-proxy"
import GitHub from "@plugin/auth/github"
import { FastifyAuth } from "@plugin/auth"

const fastify = Fastify({ logger: { level: "warn" } })
const _dirname = dirname(fileURLToPath(import.meta.url))

// Make sure to use a form body parser so Auth.js can receive data from the client
fastify.register(formbodyParser)

// If app is served through a proxy, trust the proxy to allow HTTPS protocol to be detected
// fastify.register(httpProxy, {
//   upstream: "https://my-api.example.com",
//   http2: false, // Set to true if your upstream supports http2
// })

fastify.register(
  FastifyAuth({
    providers: [
      GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    ],
  }),
  { prefix: "/api/auth" },
)

fastify.register(autoLoad, {
  dir: join(_dirname, "routes"),
})

fastify.register(autoLoad, {
  dir: join(_dirname, "plugins"),
})
;(async function () {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8000
  try {
    await fastify.listen({ port, host: "0.0.0.0" })
    console.log(`
  🚀 Server ready at: http://0.0.0.0:${port}
  ⌛ Next cron run at: ${updateJob.nextRun()}
  `)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})()
