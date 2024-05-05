import { Module } from '@nestjs/common';
import { HostServerController } from './host-server.controller';
import { HostServerService } from './host-server.service';
import { LoggerServerModule } from 'src/logger/logger-server.module';

@Module({
  imports: [LoggerServerModule],
  controllers: [HostServerController],
  providers: [HostServerService],
})
export class HostServerModule {}
