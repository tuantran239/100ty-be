import { Controller, Post, Res } from '@nestjs/common';
import RouterUrl from 'src/common/constant/router';
import { ContractService } from './contract.service';
import { Response } from 'express';

@Controller(RouterUrl.CONTRACT.ROOT)
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post(RouterUrl.CONTRACT.UPDATE_STATUS)
  async updateStatus(@Res() res: Response) {
    
  }
}
