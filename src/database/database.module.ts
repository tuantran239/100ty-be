import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature()],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
