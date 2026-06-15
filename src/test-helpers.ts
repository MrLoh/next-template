import { randomBytes } from 'crypto'

import { TEST_UUID_PATTERN } from '../vitest.setup'

export const createTestUuid = <T extends string = string>(): T =>
  `${TEST_UUID_PATTERN}${randomBytes(6).toString('hex')}` as T

export const isTestUuid = (id: string): boolean => id.startsWith(TEST_UUID_PATTERN)
