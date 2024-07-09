import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetProperty } from 'src/asset-type/entities/asset-property.entity';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { Asset } from 'src/asset/asset.entity';
import { AssetRepository } from 'src/asset/asset.repository';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { BatHoRepository } from 'src/bat-ho/bat-ho.repository';
import { Cash } from 'src/cash/cash.entity';
import { CashRepository } from 'src/cash/cash.repository';
import { BaseRepository } from 'src/common/repository/base.repository';
import { CustomerRepository } from 'src/customer/customer.repository';
import { Device } from 'src/device/device.entity';
import { ExtendedPeriodHistory } from 'src/extended-period-history/extended-period-history.entity';
import { GroupCash } from 'src/group-cash/entity/group-cash.entity';
import { HostServer } from 'src/host-server/host-server.entity';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { LogAction } from 'src/log-action/log-action.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { PawnRepository } from 'src/pawn/pawn.repository';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { PaymentHistoryRepository } from 'src/payment-history/payment-history.repository';
import { Role } from 'src/role/entities/role.entity';
import { UserRole } from 'src/role/entities/user-role.entity';
import { StoreRepository } from 'src/store/store.repository';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { TransactionHistoryRepository } from 'src/transaction-history/transaction-history.repository';
import { UserRepository } from 'src/user/user.repository';
import { Warehouse } from 'src/warehouse/warehouse.entity';
import { WarehouseRepository } from 'src/warehouse/warehouse.repository';
import { WorkspaceRepository } from 'src/workspace/workspace.repository';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { DeleteDataDto } from './dto/delete-data.dto';
import { QueryDatabase } from './query';

export interface DataSourceRepository {
  batHoRepository: BatHoRepository;
  cashRepository: CashRepository;
  customerRepository: CustomerRepository;
  deviceRepository: Repository<Device>;
  hostServerRepository: Repository<HostServer>;
  roleRepository: Repository<Role>;
  paymentHistoryRepository: PaymentHistoryRepository;
  transactionHistoryRepository: TransactionHistoryRepository;
  userRepository: UserRepository;
  groupCashRepository: Repository<GroupCash>;
  pawnRepository: PawnRepository;
  assetTypeRepository: Repository<AssetType>;
  assetPropertyRepository: Repository<AssetProperty>;
  extendedPeriodHistory: Repository<ExtendedPeriodHistory>;
  logAction: Repository<LogAction>;
  warehouseRepository: WarehouseRepository;
  assetRepository: AssetRepository;
  userRoleRepository: Repository<UserRole>;
  storeRepository: StoreRepository;
  workspaceRepository: WorkspaceRepository;
}

@Injectable()
export class DatabaseService {
  private repositories: DataSourceRepository;

  constructor(
    private dataSource: DataSource,
    private readonly customerRepository: CustomerRepository,
    @InjectRepository(BatHo)
    private readonly batHoRepository: BatHoRepository,
    @InjectRepository(Cash)
    private readonly cashRepository: CashRepository,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: PaymentHistoryRepository,
    @InjectRepository(TransactionHistory)
    private readonly transactionHistoryRepository: TransactionHistoryRepository,
    @InjectRepository(Pawn)
    private readonly pawnRepository: PawnRepository,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: WarehouseRepository,
    @InjectRepository(Asset)
    private readonly assetRepository: AssetRepository,
    private readonly userRepository: UserRepository,
    private readonly storeRepository: StoreRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly i18n: I18nCustomService,
    public query: QueryDatabase,
  ) {
    this.repositories = {
      batHoRepository: this.batHoRepository,
      cashRepository: this.cashRepository,
      customerRepository: this.customerRepository,
      deviceRepository: this.dataSource.manager.getRepository(Device),
      hostServerRepository: this.dataSource.manager.getRepository(HostServer),
      roleRepository: this.dataSource.manager.getRepository(Role),
      paymentHistoryRepository: this.paymentHistoryRepository,
      transactionHistoryRepository: this.transactionHistoryRepository,
      userRepository: this.userRepository,
      groupCashRepository: this.dataSource.manager.getRepository(GroupCash),
      pawnRepository: this.pawnRepository,
      assetTypeRepository: this.dataSource.manager.getRepository(AssetType),
      assetPropertyRepository:
        this.dataSource.manager.getRepository(AssetProperty),
      extendedPeriodHistory: this.dataSource.manager.getRepository(
        ExtendedPeriodHistory,
      ),
      logAction: this.dataSource.manager.getRepository(LogAction),
      warehouseRepository: this.warehouseRepository,
      assetRepository: this.assetRepository,
      userRoleRepository: this.dataSource.manager.getRepository(UserRole),
      storeRepository: this.storeRepository,
      workspaceRepository: this.workspaceRepository,
    };
  }

  private getExtendRepository<CR extends BaseRepository<any, any, any, any>>(
    customRepository: CR,
  ) {
    return {
      createAndSave: customRepository.createAndSave,
      convertDefaultOptions: customRepository.convertDefaultOptions,
      updateAndSave: customRepository.updateAndSave,
      getRelations: customRepository.getRelations,
      deleteSoft: customRepository.deleteSoft,
      deleteData: customRepository.deleteData,
      checkValidMethod: customRepository.checkValidMethod,
      checkValidWithAction: customRepository.checkValidWithAction,
      mapResponse: customRepository.mapResponse,
      mapPayload: customRepository.mapPayload,
      setCheckValid: customRepository.setCheckValid,
      filterQuery: customRepository.filterQuery,
      findAndCheckValid: customRepository.findAndCheckValid,
      findOrThrowError: customRepository.findOrThrowError,
      setQueryDefault: customRepository.setQueryDefault,
      i18n: customRepository.i18n,
    } as CR;
  }

  async runTransaction(
    callback: (
      repositories: DataSourceRepository,
      queryRunner: QueryRunner,
    ) => Promise<any>,
  ) {
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const repositories: DataSourceRepository = {
      batHoRepository: queryRunner.manager
        .getRepository(BatHo)
        .extend(this.batHoRepository),
      cashRepository: queryRunner.manager
        .getRepository(Cash)
        .extend(this.cashRepository),
      deviceRepository: queryRunner.manager.getRepository(Device),
      hostServerRepository: queryRunner.manager.getRepository(HostServer),
      roleRepository: queryRunner.manager.getRepository(Role),
      paymentHistoryRepository: queryRunner.manager
        .getRepository(PaymentHistory)
        .extend(this.paymentHistoryRepository),
      transactionHistoryRepository: queryRunner.manager
        .getRepository(TransactionHistory)
        .extend(this.transactionHistoryRepository),
      groupCashRepository: queryRunner.manager.getRepository(GroupCash),
      pawnRepository: queryRunner.manager
        .getRepository(Pawn)
        .extend(this.pawnRepository),
      assetTypeRepository: queryRunner.manager.getRepository(AssetType),
      assetPropertyRepository: queryRunner.manager.getRepository(AssetProperty),
      extendedPeriodHistory: queryRunner.manager.getRepository(
        ExtendedPeriodHistory,
      ),
      logAction: queryRunner.manager.getRepository(LogAction),
      warehouseRepository: queryRunner.manager
        .getRepository(Warehouse)
        .extend(this.warehouseRepository),
      assetRepository: queryRunner.manager
        .getRepository(Asset)
        .extend(this.assetRepository),
      userRoleRepository: queryRunner.manager.getRepository(UserRole),
      userRepository: queryRunner.manager
        .getRepository(this.userRepository.target)
        .extend({
          ...this.getExtendRepository(this.userRepository),
        }) as UserRepository,
      storeRepository: queryRunner.manager
        .getRepository(this.storeRepository.target)
        .extend({
          ...this.getExtendRepository(this.storeRepository),
        }) as StoreRepository,
      workspaceRepository: queryRunner.manager
        .getRepository(this.workspaceRepository.target)
        .extend({
          ...this.getExtendRepository(this.workspaceRepository),
        }) as WorkspaceRepository,
      customerRepository: queryRunner.manager
        .getRepository(this.customerRepository.target)
        .extend({
          ...this.getExtendRepository(this.customerRepository),
        }) as CustomerRepository,
    };

    try {
      const result = await callback(repositories, queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  getRepositories() {
    return this.repositories;
  }

  async deleteData(payload: DeleteDataDto) {
    const { repository, id } = payload;

    const repositoryDatabase = this.repositories[
      `${repository}Repository`
    ] as Repository<any>;

    let total = 0;
    let deleted = 0;

    if (repositoryDatabase) {
      if (id) {
        const result = await repositoryDatabase.delete({ id });
        total = 1;
        deleted = result.affected ?? 0;
      } else {
        const records = await repositoryDatabase.find();
        total = records.length;
        await Promise.all(
          records.map(async (record) => {
            const result = await repositoryDatabase.delete({ id: record.id });
            deleted += result.affected ?? 0;
          }),
        );
      }
    }

    return { result: `Deleted: ${deleted}/${total}` };
  }
}
