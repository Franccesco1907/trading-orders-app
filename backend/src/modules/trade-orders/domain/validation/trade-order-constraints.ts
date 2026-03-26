import {
  getMarketPrice,
  isSupportedPair,
  SUPPORTED_PAIRS,
  type SupportedPair,
} from '@modules/trade-orders/domain/constants';
import { TradeOrderType, TradeSide } from '@modules/trade-orders/domain/entities';
import { BadRequestException } from '@nestjs/common';

/** Fields required to validate market / amount rules (create or merged update). */
export type TradeOrderConstraintInput = {
  side: TradeSide;
  type: TradeOrderType;
  amount: number;
  price: number;
  pair: string;
};

export function assertTradeOrderConstraints(input: TradeOrderConstraintInput): void {
  assertKnownSide(input.side);
  assertKnownType(input.type);
  const pair = input.pair;
  assertSupportedPair(pair);
  assertPositiveAmount(input.amount);

  if (input.type === TradeOrderType.MARKET) {
    return;
  }

  const market = getMarketPrice(pair);

  if (input.type === TradeOrderType.LIMIT) {
    assertLimitPriceVsMarket(input.side, input.price, market);
    return;
  }

  if (input.type === TradeOrderType.STOP) {
    assertStopPriceVsMarket(input.side, input.price, market);
  }
}

function assertKnownSide(side: TradeSide): void {
  if (!Object.values(TradeSide).includes(side)) {
    throw new BadRequestException(`Invalid side. Allowed: ${Object.values(TradeSide).join(', ')}`);
  }
}

function assertKnownType(type: TradeOrderType): void {
  if (!Object.values(TradeOrderType).includes(type)) {
    throw new BadRequestException(`Invalid type. Allowed: ${Object.values(TradeOrderType).join(', ')}`);
  }
}

function assertSupportedPair(pair: string): asserts pair is SupportedPair {
  if (!isSupportedPair(pair)) {
    throw new BadRequestException(
      `pair must be one of: ${SUPPORTED_PAIRS.join(', ')}`,
    );
  }
}

function assertPositiveAmount(amount: number): void {
  if (amount <= 0) {
    throw new BadRequestException('amount must be greater than 0');
  }
}

function assertLimitPriceVsMarket(side: TradeSide, price: number, market: number): void {
  if (side === TradeSide.BUY && price >= market) {
    throw new BadRequestException(
      `For a buy limit order, price must be lower than the current market price (${market})`,
    );
  }
  if (side === TradeSide.SELL && price <= market) {
    throw new BadRequestException(
      `For a sell limit order, price must be higher than the current market price (${market})`,
    );
  }
}

function assertStopPriceVsMarket(side: TradeSide, price: number, market: number): void {
  if (side === TradeSide.BUY && price <= market) {
    throw new BadRequestException(
      `For a buy stop order, price must be higher than the current market price (${market})`,
    );
  }
  if (side === TradeSide.SELL && price >= market) {
    throw new BadRequestException(
      `For a sell stop order, price must be lower than the current market price (${market})`,
    );
  }
}
