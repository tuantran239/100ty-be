import { Module } from '@nestjs/common';
import { LoggerServerService } from './logger-server.service';

@Module({
  providers: [LoggerServerService],
  exports: [LoggerServerService],
})
export class LoggerServerModule {}
