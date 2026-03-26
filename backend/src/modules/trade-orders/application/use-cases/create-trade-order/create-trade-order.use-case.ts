import { assertTradeOrderConstraints } from '@modules/trade-orders/domain/validation';
import { TradeOrderStatus } from '@modules/trade-orders/domain/entities';
import {
  TRADE_ORDER_REPOSITORY,
  type TradeOrderRepositoryInterface,
} from '@modules/trade-orders/domain/repositories';
import { CreateTradeOrderDto } from '@modules/trade-orders/infrastructure/dto';
import { tradeOrderToResponse } from '@modules/trade-orders/infrastructure/mappers';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CreateTradeOrderUseCase {
  constructor(
    @Inject(TRADE_ORDER_REPOSITORY)
    private readonly tradeOrderRepository: TradeOrderRepositoryInterface,
  ) { }

  async execute(dto: CreateTradeOrderDto) {
    assertTradeOrderConstraints({
      side: dto.side,
      type: dto.type,
      amount: dto.amount,
      price: dto.price,
      pair: dto.pair,
    });

    const order = await this.tradeOrderRepository.create({
      side: dto.side,
      type: dto.type,
      amount: String(dto.amount),
      price: String(dto.price),
      pair: dto.pair,
      status: TradeOrderStatus.OPEN,
    });
    return tradeOrderToResponse(order);
  }
}
