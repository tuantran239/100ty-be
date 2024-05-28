import { Module } from '@nestjs/common';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { TransactionHistoryController } from './transaction-history.controller';
import { TransactionHistoryService } from './transaction-history.service';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  imports: [LoggerServerModule, ContractModule],
  controllers: [TransactionHistoryController],
  providers: [TransactionHistoryService],
  exports: [TransactionHistoryService],
})
export class TransactionHistoryModule {}
