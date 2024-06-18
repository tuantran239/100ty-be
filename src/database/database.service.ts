import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetProperty } from 'src/asset-type/entities/asset-property.entity';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Cash } from 'src/cash/cash.entity';
import { Customer } from 'src/customer/customer.entity';
import { CustomerRepository } from 'src/customer/customer.repository';
import { Device } from 'src/device/device.entity';
import { ExtendedPeriodHistory } from 'src/extended-period-history/extended-period-history.entity';
import { GroupCash } from 'src/group-cash/entity/group-cash.entity';
import { HostServer } from 'src/host-server/host-server.entity';
import { LogAction } from 'src/log-action/log-action.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { Role } from 'src/role/entities/role.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { DataSource, Repository } from 'typeorm';
import { DeleteDataDto } from './dto/delete-data.dto';
import { BatHoRepository } from 'src/bat-ho/bat-ho.repository';
import { CashRepository } from 'src/cash/cash.repository';
import { PaymentHistoryRepository } from 'src/payment-history/payment-history.repository';
import { TransactionHistoryRepository } from 'src/transaction-history/transaction-history.repository';
import { PawnRepository } from 'src/pawn/pawn.repository';
import { WarehouseRepository } from 'src/warehouse/warehouse.repository';
import { Warehouse } from 'src/warehouse/warehouse.entity';
import { AssetRepository } from 'src/asset/asset.repository';
import { Asset } from 'src/asset/asset.entity';
import { UserRole } from 'src/role/entities/user-role.entity';

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
}

@Injectable()
export class DatabaseService {
  private repositories: DataSourceRepository;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Customer)
    private readonly customerRepository: CustomerRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
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
    };
  }

  async runTransaction(
    callback: (repositories: DataSourceRepository) => Promise<any>,
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
      customerRepository: queryRunner.manager
        .getRepository(Customer)
        .extend(this.customerRepository),
      deviceRepository: queryRunner.manager.getRepository(Device),
      hostServerRepository: queryRunner.manager.getRepository(HostServer),
      roleRepository: queryRunner.manager.getRepository(Role),
      paymentHistoryRepository: queryRunner.manager
        .getRepository(PaymentHistory)
        .extend(this.paymentHistoryRepository),
      transactionHistoryRepository: queryRunner.manager
        .getRepository(TransactionHistory)
        .extend(this.transactionHistoryRepository),
      userRepository: queryRunner.manager
        .getRepository(User)
        .extend(this.userRepository),
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
    };

    try {
      const result = await callback(repositories);
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
