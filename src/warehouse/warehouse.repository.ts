import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import { CreateWareHouseDto } from './dto/create-warehouse.dto';
import { Warehouse } from './warehouse.entity';

export enum WarehouseStatus {
  EMPTY = 'empty',
  FULL = 'full',
}

export interface WarehouseRepository extends Repository<Warehouse> {
  this: WarehouseRepository;

  checkWarehouseExist(
    options: FindOneOptions<Warehouse>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<Warehouse>;

  createWarehouse(payload: CreateWareHouseDto): Promise<Warehouse>;
}

export const WarehouseRepositoryProvider = {
  provide: getRepositoryToken(Warehouse),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource
      .getRepository(Warehouse)
      .extend(WarehouseCustomRepository);
  },
};

export const WarehouseCustomRepository: Pick<WarehouseRepository, any> = {
  async checkWarehouseExist(
    this: WarehouseRepository,
    options: FindOneOptions<Warehouse>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const warehouse = await this.findOne(options);

    if (throwError) {
      if (exist && warehouse) {
        throw new Error(throwError.message ?? 'Warehouse exist');
      } else if (!exist && !warehouse) {
        throw new Error(
          throwError.message ?? 'Warehouse not found or not exist',
        );
      }
    }

    return warehouse;
  },

  async createWarehouse(
    this: WarehouseRepository,
    payload: CreateWareHouseDto,
  ): Promise<Warehouse> {
    const newWarehouse = await this.create({
      ...payload,
      status: payload.status ?? WarehouseStatus.EMPTY,
    });
    return this.save(newWarehouse);
  },
};
