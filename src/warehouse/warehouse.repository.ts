import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import { CreateWareHouseDto } from './dto/create-warehouse.dto';
import { Warehouse } from './warehouse.entity';
import { UpdateWareHouseDto } from './dto/update-warehouse.dto';

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

  updateWarehouse(
    payload: UpdateWareHouseDto & { id: string },
  ): Promise<Warehouse>;
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
    const warehouseStatus = Object.values(WarehouseStatus) as string[];

    if (payload.status && !warehouseStatus.includes(payload.status)) {
      throw new Error('Tình trạng kho hàng không đúng định dạng');
    }

    const newWarehouse = await this.create({
      ...payload,
      status: payload.status ?? WarehouseStatus.EMPTY,
    });

    return this.save(newWarehouse);
  },

  async updateWarehouse(
    this: WarehouseRepository,
    payload: UpdateWareHouseDto & { id: string },
  ): Promise<Warehouse> {
    const { id } = payload;

    const warehouse = await this.checkWarehouseExist({ where: { id } }, {});

    const warehouseStatus = Object.values(WarehouseStatus) as string[];

    if (payload.status && !warehouseStatus.includes(payload.status)) {
      throw new Error('Tình trạng kho hàng không đúng định dạng');
    }

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const warehouseValue = warehouse[key];

      if (warehouseValue !== undefined && warehouseValue !== payloadValue) {
        warehouse[key] = payloadValue;
      }
    }

    warehouse.updated_at = new Date();

    await this.save({
      ...warehouse,
    });

    return warehouse;
  },
};
