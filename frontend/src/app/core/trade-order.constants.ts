// Supported pairs aligned with the backend (`SUPPORTED_PAIRS`).
export const SUPPORTED_PAIRS = ['BTCUSD', 'EURUSD', 'ETHUSD'] as const;

export const MARKET_PRICES: Record<string, number> = {
  BTCUSD: 100150.4,
  EURUSD: 1.035,
  ETHUSD: 3310,
};

export type SupportedPair = (typeof SUPPORTED_PAIRS)[number];
