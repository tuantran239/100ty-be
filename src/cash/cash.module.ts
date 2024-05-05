import { Module } from '@nestjs/common';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';
import { LoggerServerModule } from 'src/logger/logger-server.module';

@Module({
  controllers: [CashController],
  providers: [CashService],
  imports: [LoggerServerModule],
  exports: [CashService],
})
export class CashModule {}
