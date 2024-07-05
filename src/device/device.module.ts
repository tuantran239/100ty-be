import { Module } from '@nestjs/common';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

@Module({
  imports: [LoggerServerModule],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
