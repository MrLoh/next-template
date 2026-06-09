// See: https://michalzalecki.com/nominal-typing-in-typescript/
export type Nominal<K, T> = K & { __brand: T }
