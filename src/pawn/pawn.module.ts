import { Module } from '@nestjs/common';
import { PawnController } from './pawn.controller';
import { PawnService } from './pawn.service';
import { UpdateStatusModule } from 'src/update-status/update-status.module';
import { LoggerServerModule } from 'src/logger/logger-server.module';

@Module({
  imports: [UpdateStatusModule, LoggerServerModule],
  controllers: [PawnController],
  providers: [PawnService],
})
export class PawnModule {}
