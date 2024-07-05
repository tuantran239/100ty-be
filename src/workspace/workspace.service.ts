import { Injectable } from '@nestjs/common';
import { NewBaseService } from 'src/common/service/new-base.service';
import { DatabaseService } from 'src/database/database.service';
import { EntitiesInStore } from 'src/store/store.data';
import { FindOneOptions } from 'typeorm';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ListWorkspaceQueryDto } from './dto/list-store-query.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { EntitiesInWorkspace } from './workspace.data';
import { Workspace } from './workspace.entity';
import { WorkspaceRepository } from './workspace.repository';

@Injectable()
export class WorkspaceService extends NewBaseService<
  Workspace,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  ListWorkspaceQueryDto,
  WorkspaceResponseDto,
  WorkspaceRepository
> {
  constructor(
    private workspaceRepository: WorkspaceRepository,
    private databaseService: DatabaseService,
  ) {
    super(workspaceRepository, 'workspace', 'workspace');
  }

  async createInitAndUpdate() {
    let workspaceUpdateTotal = 0;
    let storeUpdateTotal = 0;

    let workspaceUpdated = 0;
    let storeUpdated = 0;

    await this.databaseService.runTransaction(
      async (repositories, queryRunner) => {
        const { workspaceRepository, storeRepository } = repositories;

        let workspace = await workspaceRepository.findOne({
          where: { code: 'wp_100ty' },
        });

        let store = await storeRepository.findOne({
          where: { code: 'store_100ty' },
        });

        if (!workspace && !store) {
          workspace = await workspaceRepository.createAndSave({
            name: 'Không gian 100ty',
            code: 'wp_100ty',
          });

          store = await storeRepository.createAndSave({
            name: 'Cửa hàng',
            code: 'store_100ty',
            address: 'Hà Nội',
            phoneNumber: '0123456789',
            workspaceId: workspace.id,
          });
        }

        if (workspace && store) {
          for (let i = 0; i < EntitiesInWorkspace.length; i++) {
            const ew = EntitiesInWorkspace[i];

            const results = await queryRunner.manager.query(
              `SELECT * from public.${ew.key} WHERE "workspaceId" is null`,
            );

            workspaceUpdateTotal += results.length;

            await Promise.all(
              results.map(async (result: any) => {
                const res = await queryRunner.manager
                  .query(`UPDATE public.${ew.key}
              SET "workspaceId"='${workspace.id}'
              WHERE id = '${result.id}'`);

                if (res.affected === 1) {
                  workspaceUpdated += 1;
                }
              }),
            );
          }

          for (let i = 0; i < EntitiesInStore.length; i++) {
            const es = EntitiesInStore[i];

            console.log(es)

            const results = await queryRunner.manager.query(
              `SELECT * from public.${es.key} WHERE "storeId" is null`,
            );

            storeUpdateTotal += results.length;

            await Promise.all(
              results.map(async (result: any) => {
                const res = await queryRunner.manager
                  .query(`UPDATE public.${es.key}
              SET "storeId"='${store.id}'
              WHERE id = '${result.id}'`);

                if (res.affected === 1) {
                  storeUpdated += 1;
                }
              }),
            );
          }
        }
      },
    );

    return `>>>>>>>>>>>>>>>>>>>>>>>>>> Create Init Workspace and Update: { workspace: ${workspaceUpdated}/${workspaceUpdateTotal}, updated: ${storeUpdated}/${storeUpdateTotal}  }`;
  }

  listByQuery(
    query: ListWorkspaceQueryDto,
  ): Promise<{ results: Workspace[]; total: number }> {
    throw new Error('Method not implemented.');
  }

  retrieveMapResponse(options: FindOneOptions<Workspace>): Promise<Workspace> {
    throw new Error('Method not implemented.');
  }
}
