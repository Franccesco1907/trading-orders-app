import {
  TRADE_ORDER_REPOSITORY,
  type TradeOrderRepositoryInterface,
} from '@modules/trade-orders/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class SoftDeleteTradeOrderUseCase {
  constructor(
    @Inject(TRADE_ORDER_REPOSITORY)
    private readonly tradeOrderRepository: TradeOrderRepositoryInterface,
  ) { }

  async execute(id: string) {
    await this.tradeOrderRepository.softDelete(id);
    return { id, softDeleted: true };
  }
}
