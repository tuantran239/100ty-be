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
import { InjectRepository } from '@nestjs/typeorm';
import {  Response } from 'express';
import { RequestCustom } from 'src/common/types/http';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LogActionType } from 'src/common/constant/log';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { ContractCompleteGuard } from 'src/common/guard/contract-completed.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { calculateTotalMoneyPaymentHistory } from 'src/common/utils/history';
import { mapTransactionHistoryResponse } from 'src/common/utils/map';
import { formatDate } from 'src/common/utils/time';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
} from 'src/payment-history/payment-history.type';
import { RoleId, RoleName } from 'src/role/role.type';
import { User } from 'src/user/user.entity';
import { CreatePawnDto } from './dto/create-pawn.dto';
import { ExtendedPeriodConfirmDto } from './dto/extended-period-confirm.dto';
import { ListPawnQueryDto } from './dto/list-pawn-query.dto';
import { LoanMoreMoneyDto } from './dto/loan-more-money.dto';
import { PaymentDownRootMoneyDto } from './dto/payment-down-root-money.dto';
import { SettlementPawnDto } from './dto/settlement-pawn.dto';
import { UpdatePawnDto } from './dto/update-pawn.dto';
import { InitPeriodTypeData } from './pawn.data';
import { Pawn } from './pawn.entity';
import { PawnRepository } from './pawn.repository';
import { PawnRouter } from './pawn.router';
import { PawnService } from './pawn.service';

const ENTITY_LOG = 'Pawn';

@Controller(PawnRouter.ROOT)
export class PawnController {
  constructor(
    private pawnService: PawnService,
    private logActionService: LogActionService,
    private logger: LoggerServerService,
    @InjectRepository(Pawn)
    private readonly pawnRepository: PawnRepository,
  ) {}

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
     
    },
    {
      id: RoleId.USER,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(PawnRouter.CREATE)
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
        workspaceId: payload.workspaceId
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(PawnRouter.UPDATE)
  async updateCash(
    @Body(new BodyValidationPipe()) payload: UpdatePawnDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(PawnRouter.LIST)
  async listPawn(
    @Body(new BodyValidationPipe()) payload: ListPawnQueryDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const me = req.user;

      const listPawnPagination = await this.pawnService.listPawn(payload, me);

      const listAllPawn = await this.pawnService.listPawn(
        { ...payload, page: undefined, pageSize: undefined },
        me,
      );

      const totalMoney = await this.pawnService.calculateTotalPricePawn(
        listAllPawn.list_pawn,
      );

      const responseData: ResponseData = {
        message: 'success',
        data: {
          list_pawn: listPawnPagination.list_pawn,
          total: listPawnPagination.total,
          totalMoney,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(PawnRouter.INFO)
  async getBatHoInfo(@Res() res: Response, @Req() req: RequestCustom) {
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

      const totalMoney = calculateTotalMoneyPaymentHistory(
        paymentHistories ?? [],
      );

      const paymentHistoriesResponse: any[] = paymentHistories
        .sort(
          (p1, p2) =>
            new Date(p1.endDate).getTime() - new Date(p2.endDate).getTime(),
        )
        .map((paymentHistory) => ({
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
          isDeductionMoney:
            paymentHistory.type === PaymentHistoryType.DEDUCTION_MONEY,
          isRootMoney: paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
          paymentDate: formatDate(paymentHistory.endDate),
        }));

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
        this.pawnRepository.calculateInterestToToday(pawn);

      pawn.paymentHistories = undefined;

      const transactionHistories = pawn.transactionHistories ?? [];

      const { latePaymentMoney, latePaymentPeriod, badDebitMoney } =
        this.pawnRepository.calculateLateAndBadPayment(pawn);

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
          totalMoney,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(PawnRouter.DELETE)
  async deleteBatHo(@Res() res: Response, @Req() req: RequestCustom) {
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(PawnRouter.REMOVE)
  async removeBatHo(@Res() res: Response, @Req() req: RequestCustom) {
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(PawnRouter.PERIOD_TYPE)
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(PawnRouter.SETTLEMENT_REQUEST)
  async settlementRequest(@Res() res: Response, @Req() req: RequestCustom) {
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(PawnRouter.SETTLEMENT_CHANGE)
  async settlementChange(@Res() res: Response, @Req() req: RequestCustom) {
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard, ContractCompleteGuard)
  @Post(PawnRouter.SETTLEMENT_CONFIRM)
  async settlementConfirm(
    @Body(new BodyValidationPipe()) payload: SettlementPawnDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(PawnRouter.PAYMENT_DOWN_REQUEST)
  async paymentDownRootMoneyRequest(@Res() res: Response, @Req() req: RequestCustom) {
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard, ContractCompleteGuard)
  @Post(PawnRouter.PAYMENT_DOWN_CONFIRM)
  async paymentDownRootMoneyConfirm(
    @Body(new BodyValidationPipe()) payload: PaymentDownRootMoneyDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(PawnRouter.LOAN_MORE_REQUEST)
  async loanMoreMoneyRequest(@Res() res: Response, @Req() req: RequestCustom) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.loanMoreMoneyRequest(id);

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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard, ContractCompleteGuard)
  @Post(PawnRouter.LOAN_MORE_CONFIRM)
  async loanMoreMoneyConfirm(
    @Body(new BodyValidationPipe()) payload: LoanMoreMoneyDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
  ) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.loanMoreMoneyConfirm(id, payload);

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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(PawnRouter.EXTENDED_PERIOD_REQUEST)
  async extendedPeriodRequest(@Res() res: Response, @Req() req: RequestCustom) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.extendedPeriodRequest(id);

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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Pawn(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard, ContractCompleteGuard)
  @Post(PawnRouter.EXTENDED_PERIOD_CONFIRM)
  async extendedPeriodConfirm(
    @Body(new BodyValidationPipe()) payload: ExtendedPeriodConfirmDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
  ) {
    try {
      const id = req.params.id;

      const data = await this.pawnService.extendedPeriodConfirm(id, payload);

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
