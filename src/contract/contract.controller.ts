import {
  Controller,
  Post,
  Res,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import RouterUrl from 'src/common/constant/router';
import { ContractService } from './contract.service';
import { Request, Response } from 'express';
import { ResponseData } from 'src/common/types';

@Controller(RouterUrl.CONTRACT.ROOT)
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post(RouterUrl.CONTRACT.UPDATE_STATUS)
  async updateStatus(@Res() res: Response, @Req() req: Request) {
    try {
      const { contractType } = req.body;

      const data =
        await this.contractService.updateStatusContract(contractType);

      const responseData: ResponseData = {
        message: 'success',
        data,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
