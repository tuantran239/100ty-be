import { Injectable } from '@nestjs/common';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Cash } from 'src/cash/cash.entity';
import { Customer } from 'src/customer/customer.entity';
import { Device } from 'src/device/device.entity';
import { GroupCash } from 'src/group-cash/entity/group-cash.entity';
import { HostServer } from 'src/host-server/host-server.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { Role } from 'src/role/entities/role.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { DataSource, Repository } from 'typeorm';

export interface DataSourceRepository {
  batHoRepository: Repository<BatHo>;
  cashRepository: Repository<Cash>;
  customerRepository: Repository<Customer>;
  deviceRepository: Repository<Device>;
  hostServerRepository: Repository<HostServer>;
  roleRepository: Repository<Role>;
  paymentHistoryRepository: Repository<PaymentHistory>;
  transactionHistoryRepository: Repository<TransactionHistory>;
  userRepository: Repository<User>;
  groupCashRepository: Repository<GroupCash>;
  pawnRepository: Repository<Pawn>;
}

@Injectable()
export class DatabaseService {
  private repositories: DataSourceRepository;

  constructor(private dataSource: DataSource) {
    this.repositories = {
      batHoRepository: this.dataSource.manager.getRepository(BatHo),
      cashRepository: this.dataSource.manager.getRepository(Cash),
      customerRepository: this.dataSource.manager.getRepository(Customer),
      deviceRepository: this.dataSource.manager.getRepository(Device),
      hostServerRepository: this.dataSource.manager.getRepository(HostServer),
      roleRepository: this.dataSource.manager.getRepository(Role),
      paymentHistoryRepository:
        this.dataSource.manager.getRepository(PaymentHistory),
      transactionHistoryRepository:
        this.dataSource.manager.getRepository(TransactionHistory),
      userRepository: this.dataSource.manager.getRepository(User),
      groupCashRepository: this.dataSource.manager.getRepository(GroupCash),
      pawnRepository: this.dataSource.manager.getRepository(Pawn),
    };
  }

  async runTransaction(
    callback: (repositories: DataSourceRepository) => Promise<any>,
  ) {
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const repositories: DataSourceRepository = {
      batHoRepository: queryRunner.manager.getRepository(BatHo),
      cashRepository: queryRunner.manager.getRepository(Cash),
      customerRepository: queryRunner.manager.getRepository(Customer),
      deviceRepository: queryRunner.manager.getRepository(Device),
      hostServerRepository: queryRunner.manager.getRepository(HostServer),
      roleRepository: queryRunner.manager.getRepository(Role),
      paymentHistoryRepository:
        queryRunner.manager.getRepository(PaymentHistory),
      transactionHistoryRepository:
        queryRunner.manager.getRepository(TransactionHistory),
      userRepository: queryRunner.manager.getRepository(User),
      groupCashRepository: queryRunner.manager.getRepository(GroupCash),
      pawnRepository: queryRunner.manager.getRepository(Pawn),
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
}
