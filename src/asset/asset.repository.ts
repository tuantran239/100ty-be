import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Pawn } from 'src/pawn/pawn.entity';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import { Asset } from './asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Warehouse } from 'src/warehouse/warehouse.entity';
import { WarehouseStatus } from 'src/warehouse/warehouse.repository';

export enum AssetStatus {
  PAWN = 'pawn',
  LIQUIDATED = 'liquidated',
  COMPLETED = 'completed',
  IMPORT_GOODS = 'import_goods',
}

export interface AssetRepository extends Repository<Asset> {
  this: AssetRepository;

  checkAssetExist(
    options: FindOneOptions<Asset>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<Asset>;

  createAsset(payload: CreateAssetDto): Promise<Asset>;

  createAssetFromPawn(payload: {
    pawn: Pawn;
    warehouseId: string;
  }): Promise<Asset>;

  updateAsset(payload: UpdateAssetDto & { id: string }): Promise<Asset>;
}

export const AssetRepositoryProvider = {
  provide: getRepositoryToken(Asset),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(Asset).extend(AssetCustomRepository);
  },
};

export const AssetCustomRepository: Pick<AssetRepository, any> = {
  async checkAssetExist(
    this: AssetRepository,
    options: FindOneOptions<Asset>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const asset = await this.findOne(options);

    if (throwError) {
      if (exist && asset) {
        throw new Error(throwError.message ?? 'Asset exist');
      } else if (!exist && !asset) {
        throw new Error(throwError.message ?? 'Asset not found or not exist');
      }
    }

    return asset;
  },

  async createAsset(
    this: AssetRepository,
    payload: CreateAssetDto,
  ): Promise<Asset> {
    const warehouses = (await this.query(
      `SELECT * FROM warehouse WHERE id = '${payload.warehouseId}'`,
    )) as Warehouse;

    const warehouse = warehouses[0];

    if (!warehouse) {
      throw new Error('Kho không tồn tại');
    }

    if (warehouse.status === WarehouseStatus.FULL) {
      throw new Error('Kho đã đầy');
    }

    const newAsset = await this.create({
      ...payload,
      status: payload.status ?? AssetStatus.IMPORT_GOODS,
    });

    return await this.save(newAsset);
  },

  async createAssetFromPawn(
    this: AssetRepository,
    payload: {
      pawn: Pawn;
      warehouseId: string;
    },
  ): Promise<Asset> {
    const newAsset = await this.createAsset({
      assetCode: payload.pawn.assetTypeId + '_' + payload.pawn.contractId,
      status: AssetStatus.PAWN,
      assetName: payload.pawn.assetName,
      loanAmount: payload.pawn.loanAmount,
      pawnId: payload.pawn.id,
      customerId: payload.pawn.customerId,
      warehouseId: payload.warehouseId,
    });

    return newAsset;
  },

  async updateAsset(
    this: AssetRepository,
    payload: UpdateAssetDto & { id: string },
  ): Promise<Asset> {
    const { id } = payload;

    const Asset = await this.checkAssetExist({ where: { id } }, {});

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const AssetValue = Asset[key];

      if (AssetValue !== undefined && AssetValue !== payloadValue) {
        Asset[key] = payloadValue;
      }
    }

    Asset.updated_at = new Date();

    await this.save({
      ...Asset,
    });

    return Asset;
  },
};
