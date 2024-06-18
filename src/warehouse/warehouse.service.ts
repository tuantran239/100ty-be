import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Warehouse } from './warehouse.entity';
import { WarehouseRepository } from './warehouse.repository';
import {
  DeleteResult,
  EntityManager,
  Equal,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ILike,
} from 'typeorm';
import { BaseService } from 'src/common/service/base.service';
import { CreateWareHouseDto } from './dto/create-warehouse.dto';
import { UpdateWareHouseDto } from './dto/update-warehouse.dto';
import { ListWarehouseQueryDto } from './dto/list-warehouse-query.dto';
import { DatabaseService } from 'src/database/database.service';
import { InitWarehouseData } from './warehouse.data';

@Injectable()
export class WarehouseService extends BaseService<
  Warehouse,
  CreateWareHouseDto,
  UpdateWareHouseDto
> {
  protected manager: EntityManager;

  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: WarehouseRepository,
    private databaseService: DatabaseService,
  ) {
    super();
  }

  async createInit() {
    let total = InitWarehouseData.length;
    let updated = 0;
    let created = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { warehouseRepository } = repositories;

      for (let i = 0; i < total; i++) {
        const initData = InitWarehouseData[i];

        const wareHouse = await warehouseRepository.findOne({
          where: { name: Equal(initData.name) },
        });

        if (!wareHouse) {
          await warehouseRepository.createWarehouse({ ...initData });
          created++;
        } else {
          updated++;
        }
      }
    });

    console.log(
      `>>>>>>>>>>>>>>>>>>>>>>>>>> Create Init Warehouse: { created: ${created}/${total}, updated: ${updated}/${total}  }`,
    );
  }

  async create(payload: CreateWareHouseDto): Promise<Warehouse> {
    return await this.warehouseRepository.createWarehouse(payload);
  }

  async update(id: string, payload: UpdateWareHouseDto): Promise<any> {
    return await this.warehouseRepository.updateWarehouse({ ...payload, id });
  }

  delete(id: string): Promise<DeleteResult> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  async listWarehouse(query: ListWarehouseQueryDto) {
    const where: FindOptionsWhere<Warehouse>[] | FindOptionsWhere<Warehouse> =
      [];

    if (query.search && query.search.trim().length > 0) {
      where.push({
        name: ILike(query.search),
      });

      where.push({
        address: ILike(query.search),
      });
    }

    if (query.status) {
      where.push({
        status: ILike(query.search),
      });
    }

    const listWarehouseData = await this.warehouseRepository.findAndCount({
      where,
      skip: query.page,
      take: query.pageSize,
    });

    return {
      list_warehouse: listWarehouseData[0],
      total: listWarehouseData[1],
    };
  }

  list(options: FindManyOptions<Warehouse>): Promise<Warehouse[]> {
    console.log(options);
    throw new Error('Method not implemented.');
  }

  listAndCount(
    options: FindManyOptions<Warehouse>,
  ): Promise<[Warehouse[], number]> {
    console.log(options);
    throw new Error('Method not implemented.');
  }

  retrieveById(id: string): Promise<Warehouse> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  retrieveOne(options: FindOneOptions<Warehouse>): Promise<Warehouse> {
    console.log(options);
    throw new Error('Method not implemented.');
  }
}
