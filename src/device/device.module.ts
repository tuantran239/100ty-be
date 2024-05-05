import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { LoggerServerModule } from 'src/logger/logger-server.module';

@Module({
  imports: [LoggerServerModule],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
