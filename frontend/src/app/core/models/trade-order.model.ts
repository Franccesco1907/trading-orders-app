export type TradeSide = 'buy' | 'sell';

export type TradeOrderType = 'limit' | 'market' | 'stop';

export interface TradeOrder {
  id: string;
  side: TradeSide | string;
  type: TradeOrderType | string;
  amount: string;
  price: string;
  status: string;
  pair: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface PaginatedTradeOrders {
  items: TradeOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTradeOrderPayload {
  side: TradeSide;
  type: TradeOrderType;
  amount: number;
  price: number;
  pair: string;
}

export type TradeOrderStatus = 'open' | 'cancelled' | 'executed';

export interface UpdateTradeOrderPayload {
  side?: TradeSide;
  type?: TradeOrderType;
  amount?: number;
  price?: number;
  pair?: string;
  status?: TradeOrderStatus;
}
