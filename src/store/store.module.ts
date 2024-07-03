import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { StoreRepository } from './store.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  providers: [StoreService, StoreRepository],
  controllers: [StoreController],
})
export class StoreModule {}
