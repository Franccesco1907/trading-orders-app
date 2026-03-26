import { DeepPartial, FindOptionsWhere } from 'typeorm';

interface ReadableRepositoryInterface<T> {
  findOneById(id: string): Promise<T | null>;
  findOneBy(conditions: Partial<T>): Promise<T | null>;
  findMany(conditions: FindOptionsWhere<T>): Promise<T[]>
}

interface WritableRepositoryInterface<T> {
  create(data: DeepPartial<T>): Promise<T>;
  update(id: string, data: DeepPartial<T>): Promise<T>;
  softDelete(id: string): Promise<void>;
}

interface FindOrFailRepositoryInterface<T> {
  findOneByIdOrFail(id: string): Promise<T>;
  findOneByOrFail(where: FindOptionsWhere<T>): Promise<T>;
}

export interface BaseRepositoryInterface<T>
  extends ReadableRepositoryInterface<T>,
  WritableRepositoryInterface<T>,
  FindOrFailRepositoryInterface<T> { }
