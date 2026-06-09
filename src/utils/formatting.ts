import { snakeCase, upperFirst } from 'lodash-es'
import pluralize from 'pluralize'

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

const DURATIONS = [
  { amount: 60, name: 'seconds' as const },
  { amount: 60, name: 'minutes' as const },
  { amount: 24, name: 'hours' as const },
  { amount: 7, name: 'days' as const },
  { amount: 4.34524, name: 'weeks' as const },
  { amount: 12, name: 'months' as const },
  { amount: Number.POSITIVE_INFINITY, name: 'years' as const },
]

/**
 * Formats a date to a relative time string
 *
 * @param date - The date to format
 * @returns The formatted date string, e.g. '2 days ago'
 */
export const formatRelativeTimeAgo = (date: Date): string => {
  let duration = (date.getTime() - Date.now()) / 1000 // Convert to seconds
  let division = DURATIONS[0]! // Initialize with the smallest division
  while (Math.abs(duration) >= division.amount) {
    duration /= division.amount
    division = DURATIONS[DURATIONS.indexOf(division) + 1]!
  }
  if (division.name === 'seconds') return 'just now'
  return relativeTimeFormatter.format(Math.round(duration), division.name)
}

/**
 * Formats a date time to a string with fixed width
 *
 * @param date - The date to format
 * @param timeZone - The time zone to use for formatting
 * @returns The formatted string
 */
export const formatDatetime = (date: Date, timeZone: string): string => {
  return date.toLocaleString('en-US', {
    timeZone: timeZone ?? 'UTC', // fallback for debugging, tz should always be set
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats a word to include an indefinite article.
 *
 * @param word - word to format
 * @returns formatted word, e.g. 'a word'
 */
export const formatIndefiniteArticle = (word: string): string => {
  const firstLetter = word.charAt(0).toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? `an ${word}` : `a ${word}`
}

/**
 * Formats a name to include a possessive suffix.
 *
 * @param name - name to format
 * @returns formatted name, e.g. 'John’s' or 'Chris’'
 */
export const formatPossessive = (name: string): string => {
  return name.endsWith('s') ? `${name}’` : `${name}’s`
}

/**
 * Formats a list of strings.
 *
 * @param list - list of strings to format
 * @param conjunction - conjunction to use between the last two items in the list
 * @returns formatted list, e.g. 'one, two, and three'
 */
export const formatList = (list: string[], conjunction: 'and' | 'or' = 'and'): string => {
  const listFormatter = new Intl.ListFormat('en-US', {
    style: 'long',
    type: conjunction === 'and' ? 'conjunction' : 'disjunction',
  })
  return listFormatter.format(list)
}

/**
 * Format a word to be conditionally pluralized.
 *
 * @param count - count to determine if the word should be pluralized
 * @param single - optional singular form of the word
 * @param plural - optional plural form of the word
 * @returns conditional 's' (e.g. '' or 's') or formatted words, e.g. ('octopus' -> 'octopi')
 */
export const formatPlural = (count: number, singular?: string, plural?: string) => {
  if (!singular) return ''
  if (!plural) plural = pluralize(singular)
  return count === 1 ? singular : plural
}

/**
 * Formats a number to a string with thousands separator.
 *
 * @param number - number to format
 * @param singular - optional singular form of the unit
 * @param plural - optional plural form of the unit
 * @returns formatted number with optional unit, e.g. '1,234,567 seconds'
 */
export const formatNumber = (number: number, singular?: string, plural?: string): string => {
  const unit = formatPlural(number, singular, plural)
  return unit ? `${number.toLocaleString('en-US')} ${unit}` : number.toLocaleString('en-US')
}

/**
 * Formats a sentence to guarantee a capitalized first letter and a period at the end.
 *
 * @param sentence - sentence to format
 * @returns formatted sentence, e.g. 'you need to be an admin' -> 'You need to be an admin.'
 */
export const formatSentence = (sentence: string) => {
  return upperFirst(sentence.trimStart()) + (sentence.trimEnd().slice(-1) !== '.' ? '.' : '')
}

/**
 * Formats a variable name to a human readable string.
 *
 * @param varName - variable name to format
 * @param capitalize - whether to capitalize the first letter of each word
 * @returns formatted variable name, e.g. 'readPage' -> 'read page'
 */
export const formatSentenceCase = (varName: string, capitalize?: boolean) => {
  const formatted = snakeCase(varName).replace(/_/g, ' ')
  return capitalize ? formatted.split(' ').map(upperFirst).join(' ') : formatted
}
