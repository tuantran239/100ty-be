import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { AssetType } from './asset-type.entity';
import { CreateAssetTypeDto } from './dto/crerate-asset-type.dto';
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

  async create(payload: CreateAssetTypeDto): Promise<AssetType> {
    const newAssetType = await this.assetTypeRepository.create(payload);
    return await this.assetTypeRepository.save(newAssetType);
  }

  async update(id: string, payload: UpdateAssetTypeDto): Promise<any> {
    const assetType = await this.assetTypeRepository.findOne({ where: { id } });

    if (!assetType) {
      throw new Error('Không tìm thấy loại tài sản');
    }

    return await this.assetTypeRepository.update({ id }, payload);
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
