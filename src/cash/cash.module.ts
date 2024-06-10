import { Module } from '@nestjs/common';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { CashRepositoryProvider } from './cash.repository';

@Module({
  controllers: [CashController],
  providers: [CashService, CashRepositoryProvider],
  imports: [LoggerServerModule],
  exports: [CashService],
})
export class CashModule {}
