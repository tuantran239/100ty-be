import {
  Controller,
  InternalServerErrorException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransactionHistoryService } from './transaction-history.service';
import { Response } from 'express';
import { ResponseData } from 'src/common/interface';

@Controller('/api/transaction-history')
export class TransactionHistoryController {
  constructor(private transactionHistoryService: TransactionHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/convert-data')
  async checkAndUpdateCash(@Res() res: Response) {
    try {
      await this.transactionHistoryService.convertData();
      const responseData: ResponseData = {
        message: 'success',
        data: null,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
