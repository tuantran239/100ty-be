import { Injectable } from '@nestjs/common';
import { AssetTypeService } from 'src/asset-type/asset-type.service';
import { GroupCashService } from 'src/group-cash/group-cash.service';
import { RoleService } from 'src/role/role.service';
import { WarehouseService } from 'src/warehouse/warehouse.service';

@Injectable()
export class InitService {
  constructor(
    private assetTypeService: AssetTypeService,
    private roleService: RoleService,
    private warehouseService: WarehouseService,
    private groupCashService: GroupCashService,
  ) {
    const assetTypeServiceInit = this.assetTypeService;
    const roleServiceInit = this.roleService;
    const warehouseServiceInit = this.warehouseService;
    const groupCashServiceInit = this.groupCashService;

    async function init() {
      await assetTypeServiceInit.createInit();

      await roleServiceInit.createInit();

      await warehouseServiceInit.createInit();

      await groupCashServiceInit.createInit();

      await groupCashServiceInit.convertGroupCashContract();
    }

    init();
  }
}
