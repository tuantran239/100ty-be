import { Module } from '@nestjs/common';
import { InitService } from './init.service';

import { AssetTypeModule } from 'src/asset-type/asset-type.module';
import { GroupCashModule } from 'src/group-cash/group-cash.module';
import { RoleModule } from 'src/role/role.module';
import { UserModule } from 'src/user/user.module';
import { WarehouseModule } from 'src/warehouse/warehouse.module';

@Module({
  providers: [InitService],
  imports: [
    AssetTypeModule,
    RoleModule,
    WarehouseModule,
    GroupCashModule,
    UserModule,
  ],
})
export class InitModule {}
