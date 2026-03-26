import { TradeOrderStatus, TradeOrderType, TradeSide } from '@modules/trade-orders/domain/entities';
import { TRADE_ORDER_REPOSITORY } from '@modules/trade-orders/domain/repositories';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GetTradeOrderByIdUseCase } from './get-trade-order-by-id.use-case';

describe('GetTradeOrderByIdUseCase', () => {
  let useCase: GetTradeOrderByIdUseCase;
  const findOneByIdOrFail = jest.fn();

  beforeEach(async () => {
    findOneByIdOrFail.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTradeOrderByIdUseCase,
        {
          provide: TRADE_ORDER_REPOSITORY,
          useValue: { findOneByIdOrFail },
        },
      ],
    }).compile();

    useCase = module.get(GetTradeOrderByIdUseCase);
  });

  it('maps entity to response', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    findOneByIdOrFail.mockResolvedValue({
      id,
      side: TradeSide.SELL,
      type: TradeOrderType.LIMIT,
      amount: '2.50',
      price: '100.00000',
      status: TradeOrderStatus.OPEN,
      pair: 'ETHUSD',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const out = await useCase.execute(id);

    expect(findOneByIdOrFail).toHaveBeenCalledWith(id);
    expect(out.pair).toBe('ETHUSD');
    expect(out.id).toBe(id);
  });

  it('propagates NotFoundException from repository', async () => {
    findOneByIdOrFail.mockRejectedValue(new NotFoundException('missing'));

    await expect(useCase.execute('bad-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
