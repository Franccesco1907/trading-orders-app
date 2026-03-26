import {
  TRADE_ORDER_REPOSITORY,
  type TradeOrderRepositoryInterface,
} from '@modules/trade-orders/domain/repositories';
import { tradeOrderToResponse } from '@modules/trade-orders/infrastructure/mappers';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetTradeOrderByIdUseCase {
  constructor(
    @Inject(TRADE_ORDER_REPOSITORY)
    private readonly tradeOrderRepository: TradeOrderRepositoryInterface,
  ) { }

  async execute(id: string) {
    const order = await this.tradeOrderRepository.findOneByIdOrFail(id);
    return tradeOrderToResponse(order);
  }
}
