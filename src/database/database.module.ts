import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseController } from './database.controller';
import { CustomerRepositoryProvider } from 'src/customer/customer.repository';
import { BatHoRepositoryProvider } from 'src/bat-ho/bat-ho.repository';
import { CashRepositoryProvider } from 'src/cash/cash.repository';
import { PaymentHistoryRepositoryProvider } from 'src/payment-history/payment-history.repository';
import { TransactionHistoryRepositoryProvider } from 'src/transaction-history/transaction-history.repository';
import { PawnRepositoryProvider } from 'src/pawn/pawn.repository';
import { WarehouseRepositoryProvider } from 'src/warehouse/warehouse.repository';
import { AssetRepositoryProvider } from 'src/asset/asset.repository';
import { UserRepository } from 'src/user/user.repository';
import { User } from 'src/user/user.entity';
import { Role } from 'src/role/entities/role.entity';
import { Customer } from 'src/customer/customer.entity';
import { I18nCustomModule } from 'src/i18n-custom/i18n-custom.module';
import { StoreRepository } from 'src/store/store.repository';
import { Store } from 'src/store/store.entity';
import { WorkspaceRepository } from 'src/workspace/workspace.repository';
import { Workspace } from 'src/workspace/workspace.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Customer, Store, Workspace]),
    I18nCustomModule,
  ],
  providers: [
    DatabaseService,
    CustomerRepositoryProvider,
    BatHoRepositoryProvider,
    CashRepositoryProvider,
    PaymentHistoryRepositoryProvider,
    TransactionHistoryRepositoryProvider,
    PawnRepositoryProvider,
    WarehouseRepositoryProvider,
    AssetRepositoryProvider,
    UserRepository,
    StoreRepository,
    WorkspaceRepository,
  ],
  exports: [DatabaseService],
  controllers: [DatabaseController],
})
export class DatabaseModule {}
