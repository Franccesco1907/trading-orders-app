import { OrmBaseRepository } from '@database/orm/repositories';
import { TradeOrderEntity } from '../entities';

export const TRADE_ORDER_REPOSITORY = 'TRADE_ORDER_REPOSITORY';

export interface TradeOrderRepositoryInterface extends OrmBaseRepository<TradeOrderEntity> {
  findPage(skip: number, take: number): Promise<{ items: TradeOrderEntity[]; total: number }>;
}
