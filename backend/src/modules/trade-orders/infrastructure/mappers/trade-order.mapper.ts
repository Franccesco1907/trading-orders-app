import { TradeOrderEntity } from '@modules/trade-orders/domain/entities';

export function tradeOrderToResponse(order: TradeOrderEntity) {
  return {
    id: order.id,
    side: order.side,
    type: order.type,
    amount: order.amount,
    price: order.price,
    status: order.status,
    pair: order.pair,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
