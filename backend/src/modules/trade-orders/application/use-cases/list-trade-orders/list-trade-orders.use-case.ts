import {
  TRADE_ORDER_REPOSITORY,
  type TradeOrderRepositoryInterface,
} from '@modules/trade-orders/domain/repositories';
import { PaginationQueryDto, resolvePagination } from '@modules/trade-orders/infrastructure/dto';
import { tradeOrderToResponse } from '@modules/trade-orders/infrastructure/mappers';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ListTradeOrdersUseCase {
  constructor(
    @Inject(TRADE_ORDER_REPOSITORY)
    private readonly tradeOrderRepository: TradeOrderRepositoryInterface,
  ) { }

  async execute(query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query);
    const { items, total } = await this.tradeOrderRepository.findPage(skip, limit);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items: items.map(tradeOrderToResponse),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
