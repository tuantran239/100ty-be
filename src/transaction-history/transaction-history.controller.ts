import {
  Controller,
  InternalServerErrorException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseData } from 'src/common/types';
import { TransactionHistoryService } from './transaction-history.service';
import { TransactionHistoryRouter } from './transaction-history.router';

@Controller(TransactionHistoryRouter.ROOT)
export class TransactionHistoryController {
  constructor(private transactionHistoryService: TransactionHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post(TransactionHistoryRouter.CONVERT_TRANSACTION_HISTORY_PAYMENT_HISTORY)
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
  @Post(TransactionHistoryRouter.UPDATE_CONTRACT_TYPE)
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
