import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { LoggerServerModule } from 'src/logger/logger-server.module';

@Module({
  imports: [CloudinaryModule, LoggerServerModule],
  controllers: [UploadController],
})
export class UploadModule {}
