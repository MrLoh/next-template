import { createDbClient } from '@/infra/db'
import { createTestUuid } from '@/test-helpers'

import type { User } from './models'
import userRepository from './repository'

describe('userRepository', () => {
  const db = createDbClient()
  afterAll(() => db.destroy())

  describe('insertUser', () => {
    it('persists a user', async () => {
      // Given a user
      const user: User = {
        id: createTestUuid(),
        name: createTestUuid(),
        role: 'patient',
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
      }

      // When inserting the user
      await userRepository.insertUser(db, user)

      // Then the user can be loaded
      expect(await userRepository.getUser(db, user.id)).toEqual(user)
    })
  })

  describe('findByName', () => {
    it('returns null when the user does not exist', async () => {
      // Given a random name
      const name = createTestUuid()

      // When finding by name
      const user = await userRepository.findByName(db, name)

      // Then nothing is returned
      expect(user).toBeNull()
    })

    it('returns the stored user', async () => {
      // Given an inserted user
      const user: User = {
        id: createTestUuid(),
        name: createTestUuid(),
        role: 'patient',
        createdAt: new Date('2026-06-02T08:30:00.000Z'),
      }
      await userRepository.insertUser(db, user)

      // When finding by name
      const found = await userRepository.findByName(db, user.name)

      // Then the user matches
      expect(found).toEqual(user)
    })
  })

  describe('getUser', () => {
    it('returns null when the user does not exist', async () => {
      // Given a random id
      const id = createTestUuid()

      // When loading the user
      const user = await userRepository.getUser(db, id)

      // Then nothing is returned
      expect(user).toBeNull()
    })
  })

  describe('deleteUser', () => {
    it('returns true and removes the user when they exist', async () => {
      // Given an inserted user
      const user: User = {
        id: createTestUuid(),
        name: createTestUuid(),
        role: 'patient',
        createdAt: new Date(),
      }
      await userRepository.insertUser(db, user)

      // When deleting the user
      const deleted = await userRepository.deleteUser(db, user.id)

      // Then deletion succeeds and the user is gone
      expect(deleted).toBe(true)
      expect(await userRepository.getUser(db, user.id)).toBeNull()
    })

    it('returns false when the user does not exist', async () => {
      // Given a random id
      const id = createTestUuid()

      // When deleting the user
      const deleted = await userRepository.deleteUser(db, id)

      // Then deletion reports failure
      expect(deleted).toBe(false)
    })
  })
})
