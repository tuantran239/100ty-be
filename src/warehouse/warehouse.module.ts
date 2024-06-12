import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { WarehouseRepositoryProvider } from './warehouse.repository';

@Module({
  providers: [WarehouseService, WarehouseRepositoryProvider],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
