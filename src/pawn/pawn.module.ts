import { Module } from '@nestjs/common';
import { PawnController } from './pawn.controller';
import { PawnService } from './pawn.service';
import { LoggerServerModule } from 'src/logger/logger-server.module';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  imports: [LoggerServerModule, ContractModule],
  controllers: [PawnController],
  providers: [PawnService],
})
export class PawnModule {}
