import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [StatisticsController],
  imports: [TypeOrmModule.forFeature()],
  providers: [StatisticsService],
})
export class StatisticsModule {}
