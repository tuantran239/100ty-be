import { Injectable } from '@nestjs/common';
import { AssetTypeService } from 'src/asset-type/asset-type.service';
import { DatabaseService } from 'src/database/database.service';
import { GroupCashService } from 'src/group-cash/group-cash.service';
import { RoleService } from 'src/role/role.service';
import { UserService } from 'src/user/user.service';
import { WarehouseService } from 'src/warehouse/warehouse.service';
import { Workspace } from 'src/workspace/workspace.entity';
import { InitNewWorkspaceDto } from './dto/init-new-workspace.dto';
import { RoleId } from 'src/role/role.type';

@Injectable()
export class InitService {
  constructor(
    private assetTypeService: AssetTypeService,
    private roleService: RoleService,
    private warehouseService: WarehouseService,
    private groupCashService: GroupCashService,
    private userService: UserService,
    private databaseService: DatabaseService,
  ) {
    const assetTypeServiceInit = this.assetTypeService;
    const roleServiceInit = this.roleService;
    const warehouseServiceInit = this.warehouseService;
    const groupCashServiceInit = this.groupCashService;
    const userServiceInit = this.userService;

    async function init() {
      await assetTypeServiceInit.createInit();

      await roleServiceInit.createInit();

      await warehouseServiceInit.createInit();

      await groupCashServiceInit.createInit();

      await groupCashServiceInit.convertGroupCashContract();

      await userServiceInit.convertUserRole();
    }

    init();
  }

  async InitNewWorkspace(payload: InitNewWorkspaceDto): Promise<Workspace> {
    const newWorkspace = await this.databaseService.runTransaction(
      async (repositories) => {
        const { userRepository, storeRepository, workspaceRepository } =
          repositories;

        const workspace = await workspaceRepository.createAndSave(
          payload.workspace,
        );

        const store = await storeRepository.createAndSave({
          ...payload.store,
          workspaceId: workspace.id,
        });

        await userRepository.createAndSave({
          ...payload.user,
          workspaceId: workspace.id,
          storeId: store.id,
          role_id: RoleId.SUPER_ADMIN,
        });

        return workspace;
      },
    );

    return newWorkspace;
  }
}
