/**
 * Latest market price per tradable pair (used when validating limit and stop orders).
 */
export const MARKET_PRICES = {
  BTCUSD: 100150.4,
  EURUSD: 1.035,
  ETHUSD: 3310,
} as const;

/**
 * Name of a pair we support — same keys as {@link MARKET_PRICES}.
 * Example: `"BTCUSD"` is a SupportedPair; `"DOGEUSD"` is not.
 */
export type SupportedPair = keyof typeof MARKET_PRICES;

export const SUPPORTED_PAIRS = Object.keys(MARKET_PRICES) as SupportedPair[];

/**
 * Whether `pair` is one of the keys in {@link MARKET_PRICES}.
 *
 * The return type `pair is SupportedPair` is a TypeScript *type predicate*: if this
 * function returns `true`, TypeScript treats `pair` as `SupportedPair` afterward,
 * so you can pass it to {@link getMarketPrice} without extra casts.
 */
export function isSupportedPair(pair: string): pair is SupportedPair {
  return pair in MARKET_PRICES;
}

export function getMarketPrice(pair: SupportedPair): number {
  return MARKET_PRICES[pair];
}
