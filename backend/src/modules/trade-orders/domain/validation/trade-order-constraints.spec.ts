import { MARKET_PRICES } from '@modules/trade-orders/domain/constants';
import { TradeOrderType, TradeSide } from '@modules/trade-orders/domain/entities';
import { BadRequestException } from '@nestjs/common';
import { assertTradeOrderConstraints } from './trade-order-constraints';

describe('assertTradeOrderConstraints', () => {
  const base = {
    pair: 'BTCUSD',
    amount: 1,
    side: TradeSide.BUY,
  };

  it('allows market orders regardless of price vs market', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        type: TradeOrderType.MARKET,
        price: MARKET_PRICES.BTCUSD + 1000,
      }),
    ).not.toThrow();
  });

  it('rejects buy limit when price is not strictly below market', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        type: TradeOrderType.LIMIT,
        price: MARKET_PRICES.BTCUSD,
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts buy limit when price is below market', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        type: TradeOrderType.LIMIT,
        price: MARKET_PRICES.BTCUSD - 1,
      }),
    ).not.toThrow();
  });

  it('rejects sell limit when price is not strictly above market', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        side: TradeSide.SELL,
        type: TradeOrderType.LIMIT,
        price: MARKET_PRICES.BTCUSD,
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts buy stop when price is above market', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        type: TradeOrderType.STOP,
        price: MARKET_PRICES.BTCUSD + 1,
      }),
    ).not.toThrow();
  });

  it('rejects buy stop when price is at or below market', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        type: TradeOrderType.STOP,
        price: MARKET_PRICES.BTCUSD,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects unsupported pair', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        pair: 'DOGEUSD',
        type: TradeOrderType.MARKET,
        price: 1,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects non-positive amount', () => {
    expect(() =>
      assertTradeOrderConstraints({
        ...base,
        type: TradeOrderType.MARKET,
        price: 1,
        amount: 0,
      }),
    ).toThrow(BadRequestException);
  });
});
