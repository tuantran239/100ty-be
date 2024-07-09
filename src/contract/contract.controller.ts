import {
  Controller,
  Post,
  Res,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import {  Response } from 'express';
import { RequestCustom } from 'src/common/types/http';
import { ResponseData } from 'src/common/types';
import { ContractRouter } from './contract.router';

@Controller(ContractRouter.ROOT)
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post(ContractRouter.UPDATE_STATUS)
  async updateStatus(@Res() res: Response, @Req() req: RequestCustom) {
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
