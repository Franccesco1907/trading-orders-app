import { CreateTradeOrderUseCase } from '@modules/trade-orders/application/use-cases/create-trade-order';
import { GetTradeOrderByIdUseCase } from '@modules/trade-orders/application/use-cases/get-trade-order-by-id';
import { ListTradeOrdersUseCase } from '@modules/trade-orders/application/use-cases/list-trade-orders';
import { SoftDeleteTradeOrderUseCase } from '@modules/trade-orders/application/use-cases/soft-delete-trade-order';
import { UpdateTradeOrderUseCase } from '@modules/trade-orders/application/use-cases/update-trade-order';
import { TradeOrderEntity } from '@modules/trade-orders/domain/entities';
import { TRADE_ORDER_REPOSITORY } from '@modules/trade-orders/domain/repositories';
import { TradeOrderRepository } from '@modules/trade-orders/infrastructure/repositories';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeOrderController } from './trade-order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TradeOrderEntity])],
  controllers: [TradeOrderController],
  providers: [
    {
      provide: TRADE_ORDER_REPOSITORY,
      useClass: TradeOrderRepository,
    },
    CreateTradeOrderUseCase,
    ListTradeOrdersUseCase,
    GetTradeOrderByIdUseCase,
    UpdateTradeOrderUseCase,
    SoftDeleteTradeOrderUseCase,
  ],
  exports: [
    {
      provide: TRADE_ORDER_REPOSITORY,
      useClass: TradeOrderRepository,
    },
  ],
})
export class TradeOrderModule { }
