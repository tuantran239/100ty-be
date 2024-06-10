import { Module } from '@nestjs/common';
import { PaymentHistoryController } from './payment-history.controller';
import { PaymentHistoryService } from './payment-history.service';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { TransactionHistoryModule } from 'src/transaction-history/transaction-history.module';
import { DatabaseModule } from 'src/database/database.module';
import { ContractModule } from 'src/contract/contract.module';
import { PaymentHistoryRepositoryProvider } from './payment-history.repository';

@Module({
  imports: [
    LoggerServerModule,
    TransactionHistoryModule,
    ContractModule,
    DatabaseModule,
  ],
  controllers: [PaymentHistoryController],
  providers: [PaymentHistoryService, PaymentHistoryRepositoryProvider],
  exports: [PaymentHistoryService],
})
export class PaymentHistoryModule {}
