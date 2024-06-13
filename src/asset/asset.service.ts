import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from './asset.entity';
import { BaseService } from 'src/common/service/base.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetRepository } from './asset.repository';
import {
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ILike,
} from 'typeorm';
import { ListAssetQueryDto } from './dto/list-asset-query.dto';

@Injectable()
export class AssetService extends BaseService<
  Asset,
  CreateAssetDto,
  UpdateAssetDto
> {
  protected manager: EntityManager;

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: AssetRepository,
  ) {
    super();
  }

  async create(payload: CreateAssetDto): Promise<Asset> {
    return await this.assetRepository.createAsset(payload);
  }

  async update(id: string, payload: UpdateAssetDto): Promise<any> {
    return await this.assetRepository.updateAsset({ ...payload, id });
  }

  delete(id: string): Promise<DeleteResult> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  async listAsset(query: ListAssetQueryDto) {
    const where: FindOptionsWhere<Asset>[] | FindOptionsWhere<Asset> = [];

    if (query.search && query.search.trim().length > 0) {
      where.push({
        assetCode: ILike(query.search),
      });

      where.push({
        assetName: ILike(query.search),
      });
    }

    if (query.status) {
      where.push({
        status: ILike(query.search),
      });
    }

    const listAssetData = await this.assetRepository.findAndCount({
      where,
      skip: query.page,
      take: query.pageSize,
    });

    return {
      list_asset: listAssetData[0],
      total: listAssetData[1],
    };
  }

  list(options: FindManyOptions<Asset>): Promise<Asset[]> {
    console.log(options);
    throw new Error('Method not implemented.');
  }

  listAndCount(options: FindManyOptions<Asset>): Promise<[Asset[], number]> {
    console.log(options);
    throw new Error('Method not implemented.');
  }

  retrieveById(id: string): Promise<Asset> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  retrieveOne(options: FindOneOptions<Asset>): Promise<Asset> {
    console.log(options);
    throw new Error('Method not implemented.');
  }
}
