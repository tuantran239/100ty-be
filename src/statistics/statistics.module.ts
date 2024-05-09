import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  controllers: [StatisticsController],
  imports: [TypeOrmModule.forFeature(), ContractModule],
  providers: [StatisticsService],
})
export class StatisticsModule {}
