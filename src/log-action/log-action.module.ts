import { Global, Module } from '@nestjs/common';
import { LogActionController } from './log-action.controller';
import { LogActionService } from './log-action.service';

@Global()
@Module({
  controllers: [LogActionController],
  providers: [LogActionService],
  exports: [LogActionService],
})
export class LogActionModule {}
