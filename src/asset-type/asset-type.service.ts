import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { AssetType } from './entities/asset-type.entity';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import {
  EntityManager,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  Repository,
  DataSource,
} from 'typeorm';
import { DatabaseService } from 'src/database/database.service';
import { AssetTypeInitData } from './asset-type.data';

@Injectable()
export class AssetTypeService extends BaseService<
  AssetType,
  CreateAssetTypeDto,
  UpdateAssetTypeDto
> {
  protected manager: EntityManager;
  private assetTypeRepository: Repository<AssetType>;

  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
    this.assetTypeRepository = this.dataSource.manager.getRepository(AssetType);
  }

  async createInit() {
    let total = AssetTypeInitData.length;
    let updated = 0;
    let created = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { assetTypeRepository, assetPropertyRepository } = repositories;

      await Promise.allSettled(
        AssetTypeInitData.map(async (initData) => {
          const assetType = await assetTypeRepository.findOne({
            where: {
              id: initData.id,
            },
          });

          if (!assetType) {
            let newAssetType = await assetTypeRepository.create({
              ...initData,
              properties: undefined,
            });

            newAssetType = await assetTypeRepository.save(newAssetType);

            await Promise.all(
              initData.properties.map(async (property) => {
                const newAssetProperty = await assetPropertyRepository.create({
                  assetTypeId: newAssetType.id,
                  propertyName: property,
                });
                await assetPropertyRepository.save(newAssetProperty);
              }),
            );
            created++;
          }
          updated++;
        }),
      );
    });

    console.log(
      `>>>>>>>>>>>>>>>>>>>>>>>>>> Create Init Asset Type: { created: ${created}/${total}, updated: ${updated}/${total}  }`,
    );
  }

  async create(payload: CreateAssetTypeDto): Promise<AssetType> {
    const newAssetType = await this.databaseService.runTransaction(
      async (repositories) => {
        const { assetPropertyRepository, assetTypeRepository } = repositories;

        const payloadAssetType = {
          ...payload,
          properties: undefined,
        };

        let newAssetType = await assetTypeRepository.create(payloadAssetType);

        newAssetType = await assetTypeRepository.save(newAssetType);

        await Promise.all(
          payload.properties.map(async (property) => {
            const newAssetProperty = await assetPropertyRepository.create({
              assetTypeId: newAssetType.id,
              propertyName: property,
              workspaceId: payload.workspaceId,
            });
            await assetPropertyRepository.save(newAssetProperty);
          }),
        );

        return newAssetType;
      },
    );

    return newAssetType;
  }

  async update(id: string, payload: UpdateAssetTypeDto): Promise<any> {
    const propertyUpdated = await this.databaseService.runTransaction(
      async (properties) => {
        const { assetPropertyRepository, assetTypeRepository } = properties;

        const assetType = await assetTypeRepository.findOne({
          where: { id },
          relations: ['properties'],
        });

        if (!assetType) {
          throw new Error('Không tìm thấy loại tài sản');
        }

        if (payload.properties) {
          await assetPropertyRepository.delete({ assetTypeId: assetType.id });
          await Promise.all(
            payload.properties.map(async (property) => {
              const newAssetProperty = await assetPropertyRepository.create({
                assetTypeId: assetType.id,
                propertyName: property,
                workspaceId: payload.workspaceId,
              });
              await assetPropertyRepository.save(newAssetProperty);
            }),
          );
        }

        return await this.assetTypeRepository.update(
          { id },
          { ...payload, properties: undefined },
        );
      },
    );

    return propertyUpdated;
  }

  async delete(id: string): Promise<DeleteResult> {
    const assetType = await this.assetTypeRepository.findOne({ where: { id } });

    if (!assetType) {
      throw new Error('Không tìm thấy loại tài sản');
    }

    return await this.assetTypeRepository.delete({ id });
  }

  async list(options: FindManyOptions<AssetType>): Promise<AssetType[]> {
    return this.assetTypeRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<AssetType>,
  ): Promise<[AssetType[], number]> {
    return this.assetTypeRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<AssetType> {
    const assetType = await this.assetTypeRepository.findOne({ where: { id } });

    if (!assetType) {
      throw new Error('Không tìm thấy loại tài sản');
    }

    return assetType;
  }

  async retrieveOne(options: FindOneOptions<AssetType>): Promise<AssetType> {
    const assetType = await this.assetTypeRepository.findOne(options);

    if (!assetType) {
      throw new Error('Không tìm thấy loại tài sản');
    }

    return assetType;
  }
}
