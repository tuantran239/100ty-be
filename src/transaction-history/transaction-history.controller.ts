import {
  Controller,
  InternalServerErrorException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseData } from 'src/common/interface';
import { TransactionHistoryService } from './transaction-history.service';

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

  @UseGuards(JwtAuthGuard)
  @Post('/convert-transaction-history-payment-history')
  async convertTransactionPaymentHistory(@Res() res: Response) {
    try {
      const data =
        await this.transactionHistoryService.convertTransactionPaymentHistory();
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

  @UseGuards(JwtAuthGuard)
  @Post('/update-contract-type')
  async updateContractType(@Res() res: Response) {
    try {
      const data = await this.transactionHistoryService.updateContractType();
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
