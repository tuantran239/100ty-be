import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from 'src/database/database.service';
import { DebitStatus } from '../interface/bat-ho';

@Injectable()
export class ContractCompleteGuard implements CanActivate {
  constructor(private databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;

    const { pawnRepository, batHoRepository } =
      this.databaseService.getRepositories();

    try {
      const id = request.params.id;

      const pawnId = id.includes('pawn');

      let contract: any = undefined;

      if (pawnId) {
        contract = await pawnRepository.findOne({ where: { id } });
      } else {
        contract = await batHoRepository.findOne({ where: { id } });
      }

      if (contract && contract.debitStatus === DebitStatus.COMPLETED) {
        throw new Error(`Hợp đồng này đã được hoàn thành`);
      }

      return true;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
