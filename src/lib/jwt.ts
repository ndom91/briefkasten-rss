import { hkdf } from "@panva/hkdf"
import { jwtDecrypt } from "jose"

async function getDerivedEncryptionKey(keyMaterial: Parameters<typeof hkdf>[1], salt: Parameters<typeof hkdf>[2]) {
  return await hkdf("sha256", keyMaterial, salt, `Auth.js Generated Encryption Key (${salt})`, 64)
}
export async function decode<Payload = JWT>(params: JWTDecodeParams): Promise<Payload | null> {
  const { token, secret, salt } = params
  if (!token) return null
  const encryptionSecret = await getDerivedEncryptionKey(secret, salt)
  const { payload } = await jwtDecrypt(token, encryptionSecret, {
    clockTolerance: 15,
  })
  return payload as Payload
}

export interface DefaultJWT extends Record<string, unknown> {
  name?: string | null
  email?: string | null
  picture?: string | null
  sub?: string
  iat?: number
  exp?: number
  jti?: string
}
/**
 * Returned by the `jwt` callback and `getToken`, when using JWT sessions
 *
 * [`jwt` callback](https://next-auth.js.org/configuration/callbacks#jwt-callback) | [`getToken`](https://next-auth.js.org/tutorials/securing-pages-and-api-routes#using-gettoken)
 */
interface JWT extends Record<string, unknown>, DefaultJWT {}

interface JWTEncodeParams<Payload = JWT> {
  /**
   * The maximum age of the Auth.js issued JWT in seconds.
   *
   * @default 30 * 24 * 60 * 60 // 30 days
   */
  maxAge?: number
  /** Used in combination with `secret`, to derive the encryption secret for JWTs. */
  salt: string
  /** Used in combination with `salt`, to derive the encryption secret for JWTs. */
  secret: string
  /** The JWT payload. */
  token?: Payload
}

interface JWTDecodeParams {
  /** Used in combination with `secret`, to derive the encryption secret for JWTs. */
  salt: string
  /** Used in combination with `salt`, to derive the encryption secret for JWTs. */
  secret: string
  /** The Auth.js issued JWT to be decoded */
  token?: string
}
