import { Module } from '@nestjs/common';
import { InitService } from './init.service';

import { AssetTypeModule } from 'src/asset-type/asset-type.module';
import { RoleModule } from 'src/role/role.module';
import { WarehouseModule } from 'src/warehouse/warehouse.module';
import { GroupCashModule } from 'src/group-cash/group-cash.module';

@Module({
  providers: [InitService],
  imports: [AssetTypeModule, RoleModule, WarehouseModule, GroupCashModule],
})
export class InitModule {}
