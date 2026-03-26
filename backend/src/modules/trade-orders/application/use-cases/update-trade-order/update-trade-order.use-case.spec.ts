import { TradeOrderStatus, TradeOrderType, TradeSide } from '@modules/trade-orders/domain/entities';
import { TRADE_ORDER_REPOSITORY } from '@modules/trade-orders/domain/repositories';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTradeOrderUseCase } from './update-trade-order.use-case';

describe('UpdateTradeOrderUseCase', () => {
  let useCase: UpdateTradeOrderUseCase;
  const findOneByIdOrFail = jest.fn();
  const update = jest.fn();

  const existing = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    side: TradeSide.BUY,
    type: TradeOrderType.MARKET,
    amount: '1.00',
    price: '50000.00000',
    status: TradeOrderStatus.OPEN,
    pair: 'BTCUSD',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    findOneByIdOrFail.mockReset();
    update.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTradeOrderUseCase,
        {
          provide: TRADE_ORDER_REPOSITORY,
          useValue: { findOneByIdOrFail, update },
        },
      ],
    }).compile();

    useCase = module.get(UpdateTradeOrderUseCase);
  });

  it('returns existing without calling update when body is empty', async () => {
    findOneByIdOrFail.mockResolvedValue({ ...existing });

    const out = await useCase.execute(existing.id, {});

    expect(update).not.toHaveBeenCalled();
    expect(out.id).toBe(existing.id);
  });

  it('validates merged state and persists patch', async () => {
    findOneByIdOrFail.mockResolvedValue({ ...existing, type: TradeOrderType.MARKET });
    update.mockResolvedValue({
      ...existing,
      type: TradeOrderType.LIMIT,
      price: '100000.00000',
    });

    const out = await useCase.execute(existing.id, {
      type: TradeOrderType.LIMIT,
      price: 100000,
    });

    expect(update).toHaveBeenCalledWith(existing.id, {
      type: TradeOrderType.LIMIT,
      price: '100000',
    });
    expect(out.type).toBe(TradeOrderType.LIMIT);
  });

  it('throws when merged state breaks rules', async () => {
    findOneByIdOrFail.mockResolvedValue({
      ...existing,
      type: TradeOrderType.LIMIT,
      price: '90000.00000',
      side: TradeSide.BUY,
    });

    await expect(
      useCase.execute(existing.id, { price: 120000 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });
});
