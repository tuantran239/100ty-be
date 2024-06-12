import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Warehouse } from './warehouse.entity';
import { WarehouseRepository } from './warehouse.repository';
import { Equal } from 'typeorm';

export const INIT_DATA_WAREHOUSE = {
  name: 'Kho',
  address: 'Hà Nội',
};

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: WarehouseRepository,
  ) {
    const warehouseRepositoryInit = this.warehouseRepository;

    async function init() {
      const wareHouse = await warehouseRepositoryInit.findOne({
        where: { name: Equal(INIT_DATA_WAREHOUSE.name) },
      });

      if (!wareHouse) {
        warehouseRepositoryInit.createWarehouse({ ...INIT_DATA_WAREHOUSE });
      }
    }

    init();
  }
}
