import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseController } from './database.controller';
import { UserRepositoryProvider } from 'src/user/user.repository';
import { CustomerRepositoryProvider } from 'src/customer/customer.repository';
import { BatHoRepositoryProvider } from 'src/bat-ho/bat-ho.repository';
import { CashRepositoryProvider } from 'src/cash/cash.repository';
import { PaymentHistoryRepositoryProvider } from 'src/payment-history/payment-history.repository';
import { TransactionHistoryRepositoryProvider } from 'src/transaction-history/transaction-history.repository';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature()],
  providers: [
    DatabaseService,
    UserRepositoryProvider,
    CustomerRepositoryProvider,
    BatHoRepositoryProvider,
    CashRepositoryProvider,
    PaymentHistoryRepositoryProvider,
    TransactionHistoryRepositoryProvider,
  ],
  exports: [DatabaseService],
  controllers: [DatabaseController],
})
export class DatabaseModule {}
