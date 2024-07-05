import { Module } from '@nestjs/common';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { HostServerController } from './host-server.controller';
import { HostServerService } from './host-server.service';

@Module({
  imports: [LoggerServerModule],
  controllers: [HostServerController],
  providers: [
    HostServerService,
   
  ],
})
export class HostServerModule {}
