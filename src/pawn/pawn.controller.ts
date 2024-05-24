import {
  Body,
  Controller,
  Delete,
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
import { InitPeriodTypeData } from 'src/common/constant/init-data';
import { LogActionType } from 'src/common/constant/log';
import RouterUrl from 'src/common/constant/router';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ResponseData, RoleId, RoleName } from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { PaymentStatusHistory } from 'src/common/interface/history';
import { PawnQuery } from 'src/common/interface/query';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import {
  calculateInterestToTodayPawn,
  calculateLateAndBadPaymentPawn,
} from 'src/common/utils/calculate';
import {
  mapPawnResponse,
  mapTransactionHistoryResponse,
} from 'src/common/utils/map';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { User } from 'src/user/user.entity';
import { And, Between, Equal, ILike, IsNull, Not, Or } from 'typeorm';
import { CreatePawnDto } from './dto/create-pawn.dto';
import { PaymentDownRootMoneyDto } from './dto/payment-down-root-money.dto';
import { SettlementPawnDto } from './dto/settlement-pawn.dto';
import { UpdatePawnDto } from './dto/update-pawn.dto';
import { PawnService } from './pawn.service';

const ENTITY_LOG = 'Pawn';

@Controller(RouterUrl.PAWN.ROOT)
export class PawnController {
  constructor(
    private pawnService: PawnService,
    private logActionService: LogActionService,
    private logger: LoggerServerService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.BAT_HO.CREATE)
  async createPawn(
    @Body(new BodyValidationPipe()) payload: CreatePawnDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const userId = req?.user?.user_id ?? '';

      const pawn = await this.pawnService.create({ ...payload, userId });

      this.logActionService.create({
        userId,
        action: LogActionType.CREATE_PAWN,
        agent: { agent: req.get('user-agent') },
        data: { ...pawn },
        payload: { ...payload },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: pawn ? { pawn } : null,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Put(RouterUrl.PAWN.UPDATE)
  async updateCash(
    @Body(new BodyValidationPipe()) payload: UpdatePawnDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const id = req.params.id;

      const pawn = await this.pawnService.update(id, { ...payload });

      const responseData: ResponseData = {
        message: 'success',
        data: { pawn },
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.BAT_HO.LIST)
  async listPawn(@Res() res: Response, @Req() req) {
    try {
      const me = req.user as User;

      const role = me.roles[0];

      const {
        search,
        fromDate,
        toDate,
        page,
        pageSize,
        debitStatus,
        receiptToday,
      } = req.body as PawnQuery;

      const where = [];
      const from = fromDate ? fromDate : formatDate(new Date());
      const to = toDate ? toDate : formatDate(new Date());
      const today = formatDate(new Date());

      let user = undefined;
      let paymentHistories = undefined;

      if (role.id === RoleId.ADMIN) {
        user = [
          {
            managerId: me.id,
          },
          {
            id: me.id,
          },
        ];
      } else if (role.id === RoleId.USER) {
        user = {
          id: me.id,
        };
      }

      if (receiptToday === true) {
        paymentHistories = {
          endDate: Equal(convertPostgresDate(today)),
          isDeductionMoney: Or(Equal(false), IsNull()),
          paymentStatus: Or(Equal(false), IsNull()),
        };
      }

      const query = {
        loanDate: receiptToday
          ? undefined
          : Between(convertPostgresDate(from), convertPostgresDate(to)),
        deleted_at: IsNull(),
        debitStatus: receiptToday
          ? And(Not(DebitStatus.COMPLETED), Not(DebitStatus.DELETED))
          : Not(DebitStatus.DELETED),
        user,
        paymentHistories,
      };

      if (
        (!search || (search as string).trim().length === 0) &&
        (!debitStatus || (debitStatus as string).trim().length === 0)
      ) {
        where.push({
          ...query,
        });
      } else {
        if (debitStatus && !receiptToday) {
          const values = Object.values(DebitStatus).map((value) =>
            value.toString(),
          );
          if (values.includes(debitStatus)) {
            where.push({
              ...query,
              debitStatus: ILike(debitStatus),
            });
          }
        }

        if (search) {
          const searchType = parseInt((search as string) ?? '');

          if (!Number.isNaN(searchType)) {
            where.push({
              ...query,
              customer: {
                phoneNumber: ILike(search),
              },
            });
            where.push({
              ...query,
              customer: {
                personalID: ILike(search),
              },
            });
          } else {
            where.push({
              ...query,
              customer: {
                firstName: ILike(search),
              },
            });
            where.push({
              ...query,
              customer: {
                lastName: ILike(search),
              },
            });
            where.push({
              ...query,
              contractId: ILike(search),
            });
          }
        }
      }

      const data = await this.pawnService.listAndCount({
        relations: ['customer', 'paymentHistories', 'user', 'assetType'],
        where: [...where],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
        order: { created_at: 'ASC' },
      });

      const list_pawn: any[] = [];

      for (let i = 0; i < data[0].length; i++) {
        const pawn = await this.pawnService.retrieveOne({
          where: { id: data[0][i].id },
          relations: ['customer', 'paymentHistories', 'user', 'assetType'],
        });

        if (pawn) {
          list_pawn.push({ ...(mapPawnResponse(pawn) as any)?.pawn });
        }
      }

      const responseData: ResponseData = {
        message: 'success',
        data: { list_pawn, total: data[1] },
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.BAT_HO.INFO)
  async getBatHoInfo(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const pawn = await this.pawnService.retrieveOne({
        where: [{ id }, { contractId: id }],
        relations: [
          'paymentHistories',
          'customer',
          'transactionHistories',
          'transactionHistories.user',
          'user',
          'assetType',
          'assetType.properties',
        ],
      });

      if (!pawn) {
        throw new NotFoundException('Không tìm thấy hợp đồng');
      }

      const paymentHistories = pawn.paymentHistories ?? [];

      const paymentHistoriesResponse: any[] = paymentHistories.map(
        (paymentHistory) => ({
          id: paymentHistory.id,
          rowId: paymentHistory.rowId,
          paymentStatus: paymentHistory.paymentStatus,
          startDate: formatDate(paymentHistory.startDate),
          endDate: formatDate(paymentHistory.endDate),
          totalPaymentAmount: paymentHistory.payNeed,
          customerPaymentAmount: paymentHistory.payMoney,
          payDate:
            paymentHistory.payDate !== null
              ? formatDate(paymentHistory.payDate)
              : null,
          isDeductionMoney: paymentHistory.isDeductionMoney,
          isRootMoney: paymentHistory.isRootMoney,
          paymentDate: formatDate(paymentHistory.endDate),
        }),
      );

      let paidDuration = 0;

      const moneyPaidNumber = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            paidDuration = paidDuration + 1;
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      const { interestDayToday, interestMoneyToday } =
        calculateInterestToTodayPawn(pawn);

      pawn.paymentHistories = undefined;

      const transactionHistories = pawn.transactionHistories ?? [];

      const { latePaymentMoney, latePaymentPeriod, badDebitMoney } =
        calculateLateAndBadPaymentPawn(
          pawn.paymentHistories ?? [],
          pawn.debitStatus,
        );

      const responseData: ResponseData = {
        message: 'success',
        data: {
          ...pawn,
          loanDate: formatDate(pawn.loanDate),
          moneyPaid: moneyPaidNumber,
          paymentHistories: [...paymentHistoriesResponse],
          transactionHistories: transactionHistories.map(
            (transactionHistory) => ({
              ...(mapTransactionHistoryResponse(transactionHistory) as any)
                ?.transactionHistory,
            }),
          ),
          latePaymentPeriod,
          latePaymentMoney,
          badDebitMoney,
          totalInterestMoney: pawn.revenueReceived - pawn.loanAmount,
          interestDayToday,
          interestMoneyToday,
        },
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Delete(RouterUrl.PAWN.DELETE)
  async deleteBatHo(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const result = await this.pawnService.delete(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { batHo: result },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { loggerType: 'delete', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Delete(RouterUrl.PAWN.REMOVE)
  async removeBatHo(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const result = await this.pawnService.remove(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { batHo: result },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { loggerType: 'delete', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.PAWN.PERIOD_TYPE)
  async listPeriodType(@Res() res: Response) {
    try {
      const responseData: ResponseData = {
        message: 'success',
        data: [...InitPeriodTypeData],
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.PAWN.SETTLEMENT_REQUEST)
  async settlementRequest(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.settlementRequest(id);

      const responseData: ResponseData = {
        message: 'success',
        data,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Put(RouterUrl.PAWN.SETTLEMENT_CHANGE)
  async settlementChange(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const paymentDate = req.body.paymentDate;

      const data = await this.pawnService.settlementChange(id, paymentDate);

      const responseData: ResponseData = {
        message: 'success',
        data,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.PAWN.SETTLEMENT_CONFIRM)
  async settlementConfirm(
    @Body(new BodyValidationPipe()) payload: SettlementPawnDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.settlementConfirm(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.PAWN.PAYMENT_DOWN_REQUEST)
  async paymentDownRootMoneyRequest(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.paymentDownRootMoneyRequest(id);

      const responseData: ResponseData = {
        message: 'success',
        data,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.PAWN.SETTLEMENT_CONFIRM)
  async paymentDownRootMoneyConfirm(
    @Body(new BodyValidationPipe()) payload: PaymentDownRootMoneyDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.paymentDownRootMoneyConfirm(
        id,
        payload,
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
        { loggerType: 'list', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
