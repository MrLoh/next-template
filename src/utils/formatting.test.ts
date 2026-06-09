import {
  formatDatetime,
  formatIndefiniteArticle,
  formatList,
  formatPossessive,
  formatRelativeTimeAgo,
} from './formatting'

describe('formatRelativeTimeAgo', () => {
  it('formats date to relative numeric string', () => {
    // Given a date 2 years ago
    const date = new Date()
    date.setFullYear(date.getFullYear() - 2)
    // When we format it
    const result = formatRelativeTimeAgo(date)
    // Then we get a relative time string
    expect(result).toBe('2 years ago')
  })

  it('formats date to a relative numeric string with negative duration', () => {
    // Given a date 2 weeks in the future
    const date = new Date()
    date.setDate(date.getDate() + 2 * 7)
    // When we format it
    const result = formatRelativeTimeAgo(date)
    // Then we get a relative time string
    expect(result).toBe('in 2 weeks')
  })

  it('formats date using words like yesterday', () => {
    // Given a date yesterday
    const date = new Date()
    date.setDate(date.getDate() - 1)
    // When we format it
    const result = formatRelativeTimeAgo(date)
    // Then we get a string saying 'yesterday'
    expect(result).toBe('yesterday')
  })
})

describe('formatIndefiniteArticle', () => {
  it('formats word to include an indefinite article', () => {
    // Given a word
    const word = 'member'
    // When we format it
    const result = formatIndefiniteArticle(word)
    // Then we get a string with an indefinite article
    expect(result).toBe('a member')
  })

  it('formats word to include an indefinite article with a vowel', () => {
    // Given a word
    const word = 'admin'
    // When we format it
    const result = formatIndefiniteArticle(word)
    // Then we get a string with an indefinite article
    expect(result).toBe('an admin')
  })
})

describe('formatPossessive', () => {
  it('formats name to include a possessive suffix', () => {
    // Given a name
    const name = 'John'
    // When we format it
    const result = formatPossessive(name)
    // Then we get a string with a possessive suffix
    expect(result).toBe('John’s')
  })

  it('formats name to include a possessive suffix with an s', () => {
    // Given a name
    const name = 'Chris'
    // When we format it
    const result = formatPossessive(name)
    // Then we get a string with a possessive suffix
    expect(result).toBe('Chris’')
  })
})

describe('formatList', () => {
  it('formats list of strings', () => {
    // Given a list of strings
    const list = ['one', 'two', 'three']
    // When we format it
    const result = formatList(list)
    // Then we get a string with the list formatted
    expect(result).toBe('one, two, and three')
  })

  it('formats list of strings with a single item', () => {
    // Given a list of strings
    const list = ['one']
    // When we format it
    const result = formatList(list)
    // Then we get a string with the list formatted
    expect(result).toBe('one')
  })

  it('formats list of strings with two items', () => {
    // Given a list of strings
    const list = ['one', 'two']
    // When we format it
    const result = formatList(list, 'or')
    // Then we get a string with the list formatted
    expect(result).toBe('one or two')
  })

  it('formats list of strings with no items', () => {
    // Given a list of strings
    const list: string[] = []
    // When we format it
    const result = formatList(list)
    // Then we get a string with the list formatted
    expect(result).toBe('')
  })
})

describe('formatDatetime', () => {
  it('formats date time to a string with fixed width', () => {
    // Given a date in the current timezone
    const date = new Date('2021-01-01T12:34:56')
    // When we format it
    const result = formatDatetime(date, Intl.DateTimeFormat().resolvedOptions().timeZone)
    // Then we get a string with the date formatted
    expect(result).toBe('01/01/2021, 12:34 PM')
  })

  it('formats date time to a string with fixed width in a different timezone', () => {
    // Given a date in a different timezone
    const date = new Date('2021-01-01T12:34:56+00:00')
    const timeZone = 'America/New_York'
    // When we format it
    const result = formatDatetime(date, timeZone)
    // Then we get a string with the date formatted
    expect(result).toBe('01/01/2021, 07:34 AM')
  })
})
