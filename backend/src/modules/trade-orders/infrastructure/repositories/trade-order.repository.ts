import { OrmBaseRepository } from '@database/orm/repositories';
import { TradeOrderEntity } from '@modules/trade-orders/domain/entities';
import { TradeOrderRepositoryInterface } from '@modules/trade-orders/domain/repositories';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, IsNull, Repository } from 'typeorm';

@Injectable()
export class TradeOrderRepository
  extends OrmBaseRepository<TradeOrderEntity>
  implements TradeOrderRepositoryInterface {
  constructor(
    @InjectRepository(TradeOrderEntity) private readonly tradeOrderRepository: Repository<TradeOrderEntity>,
    dataSource: DataSource,
  ) {
    super(tradeOrderRepository.target, dataSource);
  }

  async findPage(
    skip: number,
    take: number,
  ): Promise<{ items: TradeOrderEntity[]; total: number }> {
    const where = { deletedAt: IsNull() } as FindOptionsWhere<TradeOrderEntity>;
    const [items, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { items, total };
  }
}
