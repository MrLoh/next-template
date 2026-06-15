import {
  hash,
  hashPassword,
  secretHash,
  signJwt,
  uuid,
  verifyJwt,
  verifyPasswordHash,
  verifySecretHash,
} from './crypto'

describe('hash', () => {
  it('should hash a string with SHA256', () => {
    // Given a string
    const value = 'test'
    // When I hash the string
    const hashValue = hash(value)
    // Then I should get a hash back
    expect(hashValue).toBeDefined()
    expect(hashValue).not.toBe(value)
    // And the hash should be a hex-encoded SHA256 digest
    expect(hashValue).toMatch(/^[a-f0-9]{64}$/)
    // And the hash should be the same for the same string
    expect(hash(value)).toBe(hashValue)
    expect(hashValue).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')
  })
})

describe('secretHash', () => {
  it('should hash a string with HMAC-SHA256', () => {
    // Given a string
    const value = 'test'
    // When I hash the string
    const hashValue = secretHash(value)
    // Then I should get a hash back
    expect(hashValue).toBeDefined()
    expect(hashValue).not.toBe(value)
    // And the hash should be a hex-encoded HMAC-SHA256 digest
    expect(hashValue).toMatch(/^[a-f0-9]{64}$/)
    // And the hash should be the same for the same string
    expect(secretHash(value)).toBe(hashValue)
  })
})

describe('verifySecretHash', () => {
  it('should return true for a matching secret', () => {
    // Given a secret and its hash
    const secret = 'my-api-key'
    const hashedSecret = secretHash(secret)
    // When verifying the secret
    const result = verifySecretHash(secret, hashedSecret)
    // Then the result should be true
    expect(result).toBe(true)
  })

  it('should return false for a non-matching secret', () => {
    // Given a hash for a different secret
    const hashedSecret = secretHash('correct-secret')
    // When verifying with the wrong secret
    const result = verifySecretHash('wrong-secret', hashedSecret)
    // Then the result should be false
    expect(result).toBe(false)
  })

  it('should return false for a hash with the wrong length', () => {
    // Given a hash that is too short
    const result = verifySecretHash('secret', 'tooshort')
    // Then the result should be false
    expect(result).toBe(false)
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

  it('should return false for a malformed password hash', async () => {
    // Given malformed password hashes
    const password = 'password'
    // When verifying against each malformed hash
    const results = await Promise.all([
      verifyPasswordHash(password, 'invalid'),
      verifyPasswordHash(password, 'onlysalt:'),
      verifyPasswordHash(password, ':onlyhash'),
    ])
    // Then every result should be false
    expect(results).toEqual([false, false, false])
  })
})

describe('signJwt/verifyJwt', () => {
  it('should sign and verify a JWT', async () => {
    // Given a payload
    const payload = { sub: 'user-1', role: 'patient', name: 'alice' }
    // When signing and verifying the token
    const token = await signJwt(payload, 60_000)
    const verified = await verifyJwt(token)
    // Then the verified payload should match
    expect(verified?.sub).toBe('user-1')
    expect(verified?.role).toBe('patient')
    expect(verified?.name).toBe('alice')
    expect(verified?.iat).toBeDefined()
    expect(verified?.exp).toBeDefined()
  })

  it('should honor a custom max age', async () => {
    // Given a custom max age of 60 seconds
    const maxAge = 60_000
    // When signing and verifying the token
    const token = await signJwt({ sub: 'user-1' }, maxAge)
    const payload = await verifyJwt(token)
    // Then the token should expire in 60 seconds
    expect(payload!.exp! - payload!.iat!).toBe(60)
  })

  it('should reject an invalid token', async () => {
    // Given an invalid token
    const token = 'not-a-jwt'
    // When verifying the token
    const verified = await verifyJwt(token)
    // Then verification should fail
    expect(verified).toBeNull()
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
