/**
 * Module for cryptography: hashing (API secrets, passwords) and random tokens.
 */

import { createHash, createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'crypto'
import { jwtVerify, SignJWT } from 'jose'

import config from '@/config'

/**
 * Generates a UUID v4
 *
 * @remarks
 * This function accepts a generic type to cast the UUID to a desired nominal type.
 *
 * @returns a random UUID
 */
export const uuid = <T extends string = string>() => randomUUID() as T

/**
 * Hashes a string using SHA256
 *
 * @param string - the string to hash
 * @returns the hashed string
 */
export const hash = (string: string): string =>
  createHash('sha256').update(string, 'utf8').digest('hex')

/**
 * Hashes a string using HMAC-SHA256 keyed with the server secret.
 *
 * @remarks
 * Never use this for passwords, use {@link hashPassword} instead.
 *
 * @param string - the string to hash
 * @returns the hashed string
 */
export const secretHash = (string: string): string =>
  createHmac('sha256', config.SERVER_SECRET).update(string, 'utf8').digest('hex')

// from https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt
const SCRYPT_PARAMS = [64, { N: 2 ** 14, r: 8, p: 5, maxmem: 64 * 1024 * 1024 }] as const
/**
 * Hashes a string using scrypt with a random salt
 *
 * @param string - the string to hash
 * @returns the hashed string
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex')
  return new Promise((resolve, reject) =>
    scrypt(password, salt, ...SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) return reject(err)
      return resolve(`${salt}:${derivedKey.toString('hex')}`)
    }),
  )
}

/**
 * Securely verifies whether a password matches a stored hash
 *
 * @param password - the password to verify
 * @param passwordHash - the hash of the password to compare against
 * @returns true if the password matches the hash
 */
export const verifyPasswordHash = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  const [salt, storedKeyHex] = passwordHash.split(':')
  if (!salt || !storedKeyHex) return false
  const storedKey = Buffer.from(storedKeyHex, 'hex')
  const derivedKey = await new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, ...SCRYPT_PARAMS, (err, key) => {
      if (err) return reject(err)
      return resolve(key)
    }),
  )
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}

/**
 * Securely verifies whether a secret value matches a stored hash
 *
 * @param secret - the secret value
 * @param hashedSecret - the hash of the secret value to compare against
 * @returns true if the secret value matches the hash
 */
export const verifySecretHash = (secret: string, hashedSecret: string) => {
  const derivedSecret = secretHash(secret)
  if (derivedSecret.length !== hashedSecret.length) return false
  return timingSafeEqual(Buffer.from(derivedSecret), Buffer.from(hashedSecret))
}

/**
 * Signs a JWT with a secret
 *
 * @param payload - the payload to sign
 * @param secret - the secret to use
 * @param maxAge - the maximum age of the token
 * @returns the signed token
 */
export const signJwt = async (
  payload: { sub: string } & Record<string, unknown>,
  maxAge: number,
) => {
  const { sub, ...claims } = payload
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAge / 1_000}s`)
    .sign(new TextEncoder().encode(config.SERVER_SECRET))
}

/**
 * Verifies a JWT with a secret
 *
 * @param token - the token to verify
 * @param secret - the secret to use
 * @returns the payload of the token
 */
export const verifyJwt = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(config.SERVER_SECRET))
    if (!payload.sub) return null
    return payload
  } catch {
    return null
  }
}
