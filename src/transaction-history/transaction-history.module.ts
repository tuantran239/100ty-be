import { Module } from '@nestjs/common';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { TransactionHistoryController } from './transaction-history.controller';
import { TransactionHistoryService } from './transaction-history.service';

@Module({
  imports: [LoggerServerModule],
  controllers: [TransactionHistoryController],
  providers: [TransactionHistoryService],
  exports: [TransactionHistoryService],
})
export class TransactionHistoryModule {}
