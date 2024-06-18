import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { WarehouseRepositoryProvider } from './warehouse.repository';

@Module({
  providers: [WarehouseService, WarehouseRepositoryProvider],
  controllers: [WarehouseController],
  exports: [WarehouseService],
})
export class WarehouseModule {}
