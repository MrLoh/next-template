/**
 * Module for cryptography: hashing (API secrets, passwords) and random tokens.
 */

import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'crypto'

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
 * Hashes a string using HMAC-SHA256 keyed with the server secret.
 *
 * @remarks
 * Never use this for passwords, use {@link hashPassword} instead.
 *
 * @param string - the string to hash
 * @returns the hashed string
 */
export const hash = (string: string): string =>
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
  const derivedSecret = hash(secret)
  if (derivedSecret.length !== hashedSecret.length) return false
  return timingSafeEqual(Buffer.from(derivedSecret), Buffer.from(hashedSecret))
}
