import { assertTradeOrderConstraints } from '@modules/trade-orders/domain/validation';
import { TradeOrderEntity } from '@modules/trade-orders/domain/entities';
import {
  TRADE_ORDER_REPOSITORY,
  type TradeOrderRepositoryInterface,
} from '@modules/trade-orders/domain/repositories';
import { UpdateTradeOrderDto } from '@modules/trade-orders/infrastructure/dto';
import { tradeOrderToResponse } from '@modules/trade-orders/infrastructure/mappers';
import { Inject, Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';

@Injectable()
export class UpdateTradeOrderUseCase {
  constructor(
    @Inject(TRADE_ORDER_REPOSITORY)
    private readonly tradeOrderRepository: TradeOrderRepositoryInterface,
  ) { }

  async execute(id: string, dto: UpdateTradeOrderDto) {
    const existing = await this.tradeOrderRepository.findOneByIdOrFail(id);

    if (this.isDtoEmpty(dto)) {
      return tradeOrderToResponse(existing);
    }

    const merged = this.mergeForValidation(existing, dto);
    assertTradeOrderConstraints(merged);

    const patch = this.buildPatch(dto);
    const updated = await this.tradeOrderRepository.update(id, patch);
    return tradeOrderToResponse(updated);
  }

  private mergeForValidation(order: TradeOrderEntity, dto: UpdateTradeOrderDto) {
    return {
      side: dto.side ?? order.side,
      type: dto.type ?? order.type,
      amount: dto.amount ?? Number(order.amount),
      price: dto.price ?? Number(order.price),
      pair: dto.pair ?? order.pair,
    };
  }

  private buildPatch(dto: UpdateTradeOrderDto): DeepPartial<TradeOrderEntity> {
    const patch: DeepPartial<TradeOrderEntity> = {};
    if (dto.side !== undefined) patch.side = dto.side;
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.amount !== undefined) patch.amount = String(dto.amount);
    if (dto.price !== undefined) patch.price = String(dto.price);
    if (dto.pair !== undefined) patch.pair = dto.pair;
    return patch;
  }

  private isDtoEmpty(dto: UpdateTradeOrderDto): boolean {
    return (
      dto.side === undefined
      && dto.type === undefined
      && dto.status === undefined
      && dto.amount === undefined
      && dto.price === undefined
      && dto.pair === undefined
    );
  }
}
