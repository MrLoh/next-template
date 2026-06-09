import { hash, hashPassword, uuid, verifyPasswordHash } from './crypto'

describe('hash', () => {
  it('should hash a string', () => {
    // Given a string
    const value = 'test'
    // When I hash the string
    const hashValue = hash(value)
    // Then I should get a hash back
    expect(hashValue).toBeDefined()
    expect(hashValue).not.toBe(value)
    // And the hash should be a hex-encoded HMAC-SHA256 digest
    expect(hashValue).toMatch(/^[a-f0-9]{64}$/)
    // And the hash should be the same for the same string
    expect(hash(value)).toBe(hashValue)
  })
})

describe('hashPassword/verifyPasswordHash', () => {
  it('should hash a password', async () => {
    // Given a password
    const password = 'password'
    // When I hash the password
    const passwordHash = await hashPassword(password)
    // Then I should get a hash back
    expect(passwordHash).toBeDefined()
    expect(passwordHash).not.toBe(password)
    // And the hash should be a string of the format salt:hash
    expect(passwordHash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/)
    // And the hash should be different for different passwords
    expect(await hashPassword('password2')).not.toBe(passwordHash)
    // And the hash should be different for different salts
    expect(await hashPassword('password')).not.toBe(await hashPassword('password'))
  })

  it('should allow verifying a password hash', async () => {
    // Given a password and a hash
    const password = 'password'
    const passwordHash = await hashPassword(password)
    // When the password is verified against the hash
    const result = await verifyPasswordHash(password, passwordHash)
    // Then the result should be true
    expect(result).toBe(true)
    // And the password hash should not verify for a different password
    expect(await verifyPasswordHash(Math.random().toString(), passwordHash)).toBe(false)
  })
})

describe('uuid', () => {
  it('should generate a valid UUID v4', () => {
    // When I generate a UUID
    const id = uuid()
    // Then it should be a valid UUID v4
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    // And it should be different each time
    expect(uuid()).not.toBe(uuid())
  })
})
