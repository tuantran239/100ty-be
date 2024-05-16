import { Module } from '@nestjs/common';
import { BatHoController } from './bat-ho.controller';
import { BatHoService } from './bat-ho.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatHo } from './bat-ho.entity';
import { CustomerModule } from 'src/customer/customer.module';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { CashModule } from 'src/cash/cash.module';
import { UserModule } from 'src/user/user.module';
import { PaymentHistoryModule } from 'src/payment-history/payment-history.module';
import { TransactionHistoryModule } from 'src/transaction-history/transaction-history.module';
import { DatabaseModule } from 'src/database/database.module';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BatHo]),
    CustomerModule,
    LoggerServerModule,
    CashModule,
    UserModule,
    PaymentHistoryModule,
    TransactionHistoryModule,
    DatabaseModule,
    ContractModule,
  ],
  controllers: [BatHoController],
  providers: [BatHoService],
  exports: [BatHoService],
})
export class BatHoModule {}
