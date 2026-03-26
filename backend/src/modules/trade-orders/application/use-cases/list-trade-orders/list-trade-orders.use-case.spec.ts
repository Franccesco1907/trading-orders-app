import { TradeOrderStatus, TradeOrderType, TradeSide } from '@modules/trade-orders/domain/entities';
import { TRADE_ORDER_REPOSITORY } from '@modules/trade-orders/domain/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { ListTradeOrdersUseCase } from './list-trade-orders.use-case';

describe('ListTradeOrdersUseCase', () => {
  let useCase: ListTradeOrdersUseCase;
  const findPage = jest.fn();

  beforeEach(async () => {
    findPage.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListTradeOrdersUseCase,
        {
          provide: TRADE_ORDER_REPOSITORY,
          useValue: { findPage },
        },
      ],
    }).compile();

    useCase = module.get(ListTradeOrdersUseCase);
  });

  it('returns paginated items and metadata', async () => {
    const rows = [
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        side: TradeSide.BUY,
        type: TradeOrderType.MARKET,
        amount: '1.00',
        price: '1.00000',
        status: TradeOrderStatus.OPEN,
        pair: 'BTCUSD',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      },
    ];
    findPage.mockResolvedValue({ items: rows, total: 25 });

    const out = await useCase.execute({ page: 2, limit: 10 });

    expect(findPage).toHaveBeenCalledWith(10, 10);
    expect(out.total).toBe(25);
    expect(out.page).toBe(2);
    expect(out.limit).toBe(10);
    expect(out.totalPages).toBe(3);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].id).toBe(rows[0].id);
  });

  it('uses default page and limit when omitted', async () => {
    findPage.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({});

    expect(findPage).toHaveBeenCalledWith(0, 20);
  });
});
