import { Module } from '@nestjs/common';
import { PaymentHistoryController } from './payment-history.controller';
import { PaymentHistoryService } from './payment-history.service';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { TransactionHistoryModule } from 'src/transaction-history/transaction-history.module';
import { UpdateStatusModule } from 'src/update-status/update-status.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    LoggerServerModule,
    TransactionHistoryModule,
    UpdateStatusModule,
    DatabaseModule,
  ],
  controllers: [PaymentHistoryController],
  providers: [PaymentHistoryService],
  exports: [PaymentHistoryService],
})
export class PaymentHistoryModule {}
