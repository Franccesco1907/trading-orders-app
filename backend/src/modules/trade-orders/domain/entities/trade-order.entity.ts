import { CustomBaseEntity } from '@database/orm/entities';
import { Column, Entity } from 'typeorm';

export enum TradeSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TradeOrderType {
  LIMIT = 'limit',
  MARKET = 'market',
  STOP = 'stop',
}

export enum TradeOrderStatus {
  OPEN = 'open',
  CANCELLED = 'cancelled',
  EXECUTED = 'executed',
}

@Entity({ name: 'trade_order' })
export class TradeOrderEntity extends CustomBaseEntity {
  @Column({ type: 'enum', enum: TradeSide })
  side: TradeSide;

  @Column({ type: 'enum', enum: TradeOrderType })
  type: TradeOrderType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 5 })
  price: string;

  @Column({
    type: 'enum',
    enum: TradeOrderStatus,
    default: TradeOrderStatus.OPEN,
  })
  status: TradeOrderStatus;

  @Column({ type: 'varchar', length: 32 })
  pair: string;
}
