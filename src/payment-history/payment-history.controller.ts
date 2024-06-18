import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import RouterUrl from 'src/common/constant/router';
import { ResponseData } from 'src/common/types';
import {
  PaymentHistoryFinishQuery,
  PaymentHistoryQuery,
} from 'src/common/types/query';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { mapPaymentHistoryResponse } from 'src/common/utils/map';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { PayMoneyDto } from './dto/pay-money';
import { PaymentHistoryService } from './payment-history.service';
import { LogActionService } from 'src/log-action/log-action.service';
import { LogActionType } from 'src/common/constant/log';
import { User } from 'src/user/user.entity';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { getSearch } from 'src/common/utils/query';
import { DatabaseService } from 'src/database/database.service';
import { IsNull } from 'typeorm';
import { RoleId } from 'src/role/role.type';
import { PaymentHistoryType } from './payment-history.type';

const ENTITY_LOG = 'PaymentHistory';

@Controller(RouterUrl.PAYMENT_HISTORY.ROOT)
export class PaymentHistoryController {
  constructor(
    private logger: LoggerServerService,
    private paymentHistoryService: PaymentHistoryService,
    private logActionService: LogActionService,
    private databaseService: DatabaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.PAYMENT_HISTORY.RETRIEVE)
  async getCustomer(@Res() res: Response, @Req() req: Request) {
    try {
      const { id } = req.params;

      const paymentHistory = await this.paymentHistoryService.retrieveOne({
        where: [{ id }],
      });

      if (!paymentHistory) {
        throw new NotFoundException('Không tìm thấy lịch sử trả');
      }

      const responseData: ResponseData = {
        message: 'success',
        data: mapPaymentHistoryResponse(paymentHistory),
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { loggerType: 'get', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.PAYMENT_HISTORY.LIST)
  async listCustomer(@Res() res: Response, @Req() req: Request) {
    try {
      const { contractId, pageSize, page } = req.body as PaymentHistoryQuery;

      const data = await this.paymentHistoryService.listAndCount({
        where: [{ contractId }],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
      });

      data[0] = data[0].map((paymentHistory) => ({
        ...(mapPaymentHistoryResponse(paymentHistory) as any)?.paymentHistory,
      }));

      const responseData: ResponseData = {
        message: 'success',
        data: {
          list_payment_history: data[0]?.sort(
            (ph1, ph2) => ph1.rowId - ph2.rowId,
          ),
          total: data[1],
        },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { loggerType: 'list', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(RouterUrl.PAYMENT_HISTORY.UPDATE)
  async payLoanMoney(
    @Body(new BodyValidationPipe()) payload: PayMoneyDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const userId = req?.user?.user_id ?? '';

      const { id } = req.params;
      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        { ...payload, id },
      );

      const paymentHistory = await this.paymentHistoryService.payLoanMoney(
        id,
        payload,
      );

      this.logActionService.create({
        userId,
        action: LogActionType.UPDATE_PAYMENT_HISTORY,
        agent: { agent: req.get('user-agent') },
        data: { ...paymentHistory },
        payload: { ...payload },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { paymentHistory },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/check-total')
  async checkTotal(@Res() res: Response) {
    try {
      const result = await this.paymentHistoryService.checkTotal();

      const responseData: ResponseData = {
        message: 'success',
        data: result,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { customerMessage: 'Check and update cash payment history' },
        null,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.PAYMENT_HISTORY.LIST_FINISH_TODAY)
  async listPaymentHistoryFinish(@Res() res: Response, @Req() req) {
    try {
      const me = req.user as User;

      const role = me.roles[0];

      let user = undefined;

      if (role.id == RoleId.USER) {
        user = {
          id: me.id,
        };
      } else if (role.id == RoleId.ADMIN) {
        user = {
          managerId: me.id,
        };
      }

      const where = [];

      const { page, pageSize, search } = req.body as PaymentHistoryFinishQuery;

      const today = convertPostgresDate(formatDate(new Date()));

      const query = {
        startDate: today,
        user,
      };

      if (search && search.trim().length > 0) {
        where.push({
          ...query,
          batHo: {
            customer: {
              firstName: getSearch(search, 'both'),
            },
          },
        });
        where.push({
          ...query,
          batHo: {
            customer: {
              lastName: getSearch(search, 'both'),
            },
          },
        });
        where.push({
          ...query,
          batHo: {
            user: {
              fullName: getSearch(search, 'both'),
            },
          },
        });
        where.push({
          ...query,
          batHo: {
            user: {
              username: getSearch(search, 'both'),
            },
          },
        });
      } else {
        where.push({ ...query });
      }

      const result =
        await this.paymentHistoryService.listPaymentHistoryFinishToday({
          where,
          take: pageSize ?? 10,
          skip: ((page ?? 1) - 1) * (pageSize ?? 10),
          relations: ['batHo', 'batHo.customer', 'batHo.user', 'user'],
        });

      const responseData: ResponseData = {
        message: 'success',
        data: result,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { customerMessage: 'Check and update cash payment history' },
        null,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.PAYMENT_HISTORY.CONVERT_TYPE)
  async convertType(@Res() res: Response) {
    try {
      const data = await this.databaseService.runTransaction(
        async (repositories) => {
          const { paymentHistoryRepository } = repositories;

          const paymentHistories = await paymentHistoryRepository.find({
            where: { type: IsNull() },
          });

          const total = paymentHistories.length;
          let converted = 0;

          await Promise.all(
            paymentHistories.map(async (paymentHistory) => {
              let type: string | null = null;
              if (paymentHistory.isDeductionMoney) {
                type = PaymentHistoryType.DEDUCTION_MONEY;
              } else if (paymentHistory.isRootMoney) {
                type = PaymentHistoryType.ROOT_MONEY;
              } else {
                type = PaymentHistoryType.INTEREST_MONEY;
              }

              await paymentHistoryRepository.update(
                { id: paymentHistory.id },
                { type },
              );

              converted++;
            }),
          );

          return { result: `Converted: ${converted}/${total}` };
        },
      );

      const responseData: ResponseData = {
        message: 'success',
        data,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { customerMessage: 'Convert type payment history' },
        null,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
