import { Auth } from "@auth/core"
import type { AuthConfig, Session } from "@auth/core/types"
import type { FastifyRequest, FastifyPluginAsync } from "fastify"
import { toWebRequest, toFastifyReply } from "./http-api-adapters"

export type { Account, DefaultSession, Profile, Session, User } from "@auth/core/types"

function FastifyAuthPlugin(authConfig: Omit<AuthConfig, "raw">): FastifyPluginAsync {
  return async (fastify, _opts) => {
    fastify.post("/*", async (request, reply) => {
      const response = await Auth(toWebRequest(request), authConfig)
      return toFastifyReply(response, reply)
    })

    fastify.get("/*", async (request, reply) => {
      const response = await Auth(toWebRequest(request), authConfig)
      return toFastifyReply(response, reply)
    })
  }
}

export function FastifyAuth(config: AuthConfig): ReturnType<typeof FastifyAuthPlugin> {
  const { ...authOptions } = config
  authOptions.secret ??= process.env.AUTH_SECRET
  authOptions.trustHost ??= !!(
    process.env.AUTH_TRUST_HOST ??
    process.env.VERCEL ??
    process.env.NODE_ENV !== "production"
  )

  return FastifyAuthPlugin(authOptions)
}

export type GetSessionResult = Promise<Session | null>

export async function getSession(req: FastifyRequest, options: Omit<AuthConfig, "raw">): GetSessionResult {
  options.secret ??= process.env.AUTH_SECRET
  options.trustHost ??= true

  const request = toWebRequest(req)
  const url = new URL("/api/auth/session", request.url)

  const response = await Auth(new Request(url, { headers: request.headers }), options)

  const { status = 200 } = response

  const data = await response.json()

  if (!data || !Object.keys(data).length) return null
  if (status === 200) return data
  throw new Error(data.message)
}
