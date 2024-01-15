import Fastify from "fastify"
import { updateJob } from "./jobs/cron-update"
import formbodyParser from "@fastify/formbody"
import GitHub from "@auth/fastify/providers/github"
import { FastifyAuth, getSession } from "@auth/fastify"
import type { FastifyReply, FastifyRequest } from "fastify"
// import httpProxy from "@fastify/http-proxy"

const fastify = Fastify({ logger: { level: "warn" } })

// Make sure to use a form body parser so Auth.js can receive data from the client
fastify.register(formbodyParser)

// If app is served through a proxy, trust the proxy to allow HTTPS protocol to be detected
// fastify.register(httpProxy, {
//   upstream: "https://my-api.example.com",
//   http2: false, // Set to true if your upstream supports http2
// })

const config = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
}

fastify.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
  const session = await getSession(req, config)
  if (!session) {
    reply.status(403).send("Unauthorized")
    return
  }
  if (session.user) {
    reply.user = session.user
  }
})

// TODO: rm after testing
fastify.get("/", (_req: FastifyRequest, reply: FastifyReply) => {
  reply.type("text/html").send(
    `
            <h1>Welcome to Auth.js + Fastify Demo!</h1>
            <ol>
            <li>Sign in at <a href="/api/auth/signin">/api/auth/signin</a> </li>
            <li>Sign out at <a href="/api/auth/signout">/api/auth/signout</a> </li>
            <li>Access the current user at <a href="/v1/users/me">/api/users/me</a> </li>
            </ol>
        `,
  )
})

fastify.register(FastifyAuth(config), { prefix: "/api/auth" })

fastify.register(import("./routes/v1/feed"), { prefix: "/v1/feed" })
fastify.register(import("./routes/v1/users"), { prefix: "/v1/users" })

fastify.register(import("./plugins/queue"))
fastify.register(import("./plugins/db"))
fastify.register(import("./plugins/sensible"))
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
