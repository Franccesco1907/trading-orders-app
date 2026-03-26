import { TRADE_ORDER_REPOSITORY } from '@modules/trade-orders/domain/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { SoftDeleteTradeOrderUseCase } from './soft-delete-trade-order.use-case';

describe('SoftDeleteTradeOrderUseCase', () => {
  let useCase: SoftDeleteTradeOrderUseCase;
  const softDelete = jest.fn();

  beforeEach(async () => {
    softDelete.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftDeleteTradeOrderUseCase,
        {
          provide: TRADE_ORDER_REPOSITORY,
          useValue: { softDelete },
        },
      ],
    }).compile();

    useCase = module.get(SoftDeleteTradeOrderUseCase);
  });

  it('calls repository softDelete and returns acknowledgement', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    softDelete.mockResolvedValue(undefined);

    const out = await useCase.execute(id);

    expect(softDelete).toHaveBeenCalledWith(id);
    expect(out).toEqual({ id, softDeleted: true });
  });
});
