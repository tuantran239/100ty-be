import { Module } from '@nestjs/common';
import { GroupCashController } from './group-cash.controller';
import { GroupCashService } from './group-cash.service';

@Module({
  controllers: [GroupCashController],
  providers: [GroupCashService],
})
export class GroupCashModule {}
