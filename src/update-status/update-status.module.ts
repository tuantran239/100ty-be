import { Module } from '@nestjs/common';
import { UpdateStatusService } from './update-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customer/customer.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, BatHo])],
  providers: [UpdateStatusService],
  exports: [UpdateStatusService],
})
export class UpdateStatusModule {}
