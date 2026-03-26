import { MARKET_PRICES } from '@modules/trade-orders/domain/constants';
import { TradeOrderStatus, TradeOrderType, TradeSide } from '@modules/trade-orders/domain/entities';
import { TRADE_ORDER_REPOSITORY } from '@modules/trade-orders/domain/repositories';
import { CreateTradeOrderDto } from '@modules/trade-orders/infrastructure/dto';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTradeOrderUseCase } from './create-trade-order.use-case';

describe('CreateTradeOrderUseCase', () => {
  let useCase: CreateTradeOrderUseCase;
  const create = jest.fn();

  beforeEach(async () => {
    create.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTradeOrderUseCase,
        {
          provide: TRADE_ORDER_REPOSITORY,
          useValue: { create },
        },
      ],
    }).compile();

    useCase = module.get(CreateTradeOrderUseCase);
  });

  const validMarketDto: CreateTradeOrderDto = {
    side: TradeSide.BUY,
    type: TradeOrderType.MARKET,
    amount: 2,
    price: 999999,
    pair: 'EURUSD',
  };

  it('persists when rules pass', async () => {
    const saved = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      side: validMarketDto.side,
      type: validMarketDto.type,
      amount: '2.00',
      price: '999999.00000',
      status: TradeOrderStatus.OPEN,
      pair: validMarketDto.pair,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    create.mockResolvedValue(saved);

    const result = await useCase.execute(validMarketDto);

    expect(create).toHaveBeenCalledWith({
      side: validMarketDto.side,
      type: validMarketDto.type,
      amount: '2',
      price: '999999',
      pair: validMarketDto.pair,
      status: TradeOrderStatus.OPEN,
    });
    expect(result.id).toBe(saved.id);
    expect(result.amount).toBe('2.00');
  });

  it('throws BadRequestException when business rules fail', async () => {
    const dto: CreateTradeOrderDto = {
      ...validMarketDto,
      type: TradeOrderType.LIMIT,
      price: MARKET_PRICES.EURUSD + 1,
      pair: 'EURUSD',
    };

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
});
