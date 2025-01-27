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
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CashFilterType } from 'src/cash/cash.type';
import { LogActionType } from 'src/common/constant/log';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { calculateTotalMoneyPaymentHistory } from 'src/common/utils/history';
import { mapTransactionHistoryResponse } from 'src/common/utils/map';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { PaymentStatusHistory } from 'src/payment-history/payment-history.type';
import { RoleId, RoleName } from 'src/role/role.type';
import { User } from 'src/user/user.entity';
import { IsNull } from 'typeorm';
import { BatHo } from './bat-ho.entity';
import { BatHoRepository } from './bat-ho.repository';
import { BatHoRouter } from './bat-ho.router';
import { BatHoService } from './bat-ho.service';
import { CreateBatHoDto } from './dto/create-bat-ho.dto';
import { ListBatHoQueryDto } from './dto/list-bat-ho-query.dto';
import { ReverseBatHoDto } from './dto/reverse-bat-ho.dto';
import { SettlementBatHoDto } from './dto/settlement-bat-ho.dto';
import { UpdateBatHoDto } from './dto/update-bat-ho.dto';

export const BAT_HO_CODE_PREFIX = 'bh';
const ENTITY_LOG = 'BatHo';

@ApiTags('Bat Ho')
@Controller(BatHoRouter.ROOT)
export class BatHoController {
  constructor(
    private batHoService: BatHoService,
    private logger: LoggerServerService,
    private logActionService: LogActionService,
    private databaseService: DatabaseService,
    @InjectRepository(BatHo) private readonly batHoRepository: BatHoRepository,
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
  @Post(BatHoRouter.CREATE)
  async createBatHo(
    @Body(new BodyValidationPipe()) payload: CreateBatHoDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const userId = req?.user?.user_id ?? '';

      this.logger.log(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );

      const batHo = await this.batHoService.create({ ...payload, userId });

      this.logActionService.create({
        userId,
        action: LogActionType.CREATE_BAT_HO,
        agent: { agent: req.get('user-agent') },
        data: { ...batHo },
        payload: { ...payload },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: batHo ? { batHo } : null,
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
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(BatHoRouter.UPDATE)
  async updateBatHo(
    @Body(new BodyValidationPipe()) payload: UpdateBatHoDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const id = req.params.id;

      const batHo = await this.batHoService.update(id, { ...payload });

      const responseData: ResponseData = {
        message: 'success',
        data: { batHo },
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
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(BatHoRouter.LIST)
  async listBatHo(
    @Body(new BodyValidationPipe()) payload: ListBatHoQueryDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const me = req.user as User;

      const listIcloudPagination = await this.batHoService.listBatHo(
        payload,
        me,
      );

      const listAllIcloud = await this.batHoService.listBatHo(
        { ...payload, page: undefined, pageSize: undefined },
        me,
      );

      const totalMoney = await this.batHoService.calculateTotalIcloud(
        listAllIcloud.list_bat_ho,
      );

      const responseData: ResponseData = {
        message: 'success',
        data: {
          list_bat_ho: listIcloudPagination.list_bat_ho,
          total: listIcloudPagination.total,
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
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard)
  @Delete(BatHoRouter.DELETE)
  async deleteBatHo(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const result = await this.batHoService.delete(id);

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
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(BatHoRouter.INFO)
  async getBatHoInfo(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const batHo = await this.batHoService.retrieveOne({
        where: [{ id }, { contractId: id }],
        relations: [
          'paymentHistories',
          'customer',
          'transactionHistories',
          'transactionHistories.user',
          'user',
          'device',
          'hostServer',
        ],
      });

      if (!batHo) {
        throw new NotFoundException('Không tìm thấy hợp đồng');
      }

      const paymentHistories = batHo.paymentHistories ?? [];

      const totalMoney = calculateTotalMoneyPaymentHistory(
        paymentHistories ?? [],
      );

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
          paymentDate: formatDate(paymentHistory.startDate),
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

      batHo.paymentHistories = undefined;

      const transactionHistories = batHo.transactionHistories ?? [];

      const moneyLoan = parseInt(
        (batHo.revenueReceived / batHo.loanDurationDays).toString(),
      );

      const { latePaymentDay, latePaymentMoney, badDebitMoney } =
        this.batHoRepository.calculateLateAndBadPayment(batHo);

      const responseData: ResponseData = {
        message: 'success',
        data: {
          ...batHo,
          loanDate: formatDate(batHo.loanDate),
          moneyPaid: moneyPaidNumber,
          moneyMustPay: batHo.revenueReceived - moneyPaidNumber,
          interest:
            batHo.revenueReceived -
            batHo.fundedAmount -
            batHo.deductionDays * moneyLoan -
            batHo.serviceFee.value,
          paymentHistories: [...paymentHistoriesResponse],
          transactionHistories: transactionHistories.map(
            (transactionHistory) => ({
              ...(mapTransactionHistoryResponse(transactionHistory) as any)
                ?.transactionHistory,
            }),
          ),
          latePaymentDay,
          latePaymentMoney,
          badDebitMoney,
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
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard)
  @Post(BatHoRouter.SETTLEMENT)
  async settlementBatHo(
    @Body(new BodyValidationPipe()) payload: SettlementBatHoDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { id } = req.params;

      const batHo = await this.batHoService.settlementBatHo(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { batHo },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { customerMessage: 'Check and update bat ho status' },
        null,
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
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(BatHoRouter.REVERSE_CONTRACT)
  async reverseBatHo(
    @Body(new BodyValidationPipe()) payload: ReverseBatHoDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const id = req.params.id;

      const { contractId, dataLoan, payDate } = payload;

      const batHo = await this.batHoService.retrieveOne({
        where: [{ contractId: id }, { id }],
      });

      if (!batHo) {
        throw new Error('Không tìm thấy hợp đồng');
      }

      if (batHo.maturityDate) {
        throw new Error('Hợp đồng này đã đáo hạn');
      }

      await this.batHoService.settlementBatHo(id, { payDate });

      const createBatHoPayload: CreateBatHoDto = {
        customerId: batHo.customerId,
        deviceId: batHo.deviceId,
        hostServerId: batHo.hostServerId,
        ...dataLoan,
        loanDate: dataLoan?.loanDate ?? payDate,
        contractId,
        oldContractId: batHo.id,
      };

      const newBatHo = await this.batHoService.create({
        ...createBatHoPayload,
        userId: req?.user?.user_id,
      });

      await this.batHoRepository.update(id, {
        maturityDate: convertPostgresDate(payDate),
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { batHo: newBatHo },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error({ customerMessage: 'Reverse bat ho' }, null);
      throw new InternalServerErrorException(error.message);
    }
  }

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new BatHo(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard)
  @Post('/check-contract-receipt')
  async checkContractReceipt(@Res() res: Response) {
    try {
      const list_receipt_contract = [];
      const list_receipt_difference = [];

      await this.databaseService.runTransaction(async (repositories) => {
        const { cashRepository, batHoRepository } = repositories;

        const contracts = await batHoRepository.find({
          where: { deleted_at: IsNull() },
          relations: ['paymentHistories'],
        });

        await Promise.all(
          contracts.map(async (contract) => {
            const cashReceiptContract = await cashRepository.find({
              where: {
                batHoId: contract.id,
                filterType: CashFilterType.RECEIPT_CONTRACT,
              },
            });

            const totalCashAmount = cashReceiptContract.reduce(
              (total, cash) => {
                return total + cash.amount;
              },
              0,
            );

            const totalPaymentHistoryAmount = contract.paymentHistories.reduce(
              (total, paymentHistory) => {
                if (
                  paymentHistory.paymentStatus ===
                    PaymentStatusHistory.FINISH &&
                  !paymentHistory.isDeductionMoney
                ) {
                  return total + paymentHistory.payMoney;
                }
                return total;
              },
              0,
            );

            if (totalCashAmount != totalPaymentHistoryAmount) {
              list_receipt_difference.push(
                `Contract ${contract.contractId} : Cash ${totalCashAmount} >>>> PaymentHistory ${totalPaymentHistoryAmount}`,
              );
            }

            list_receipt_contract.push(
              `Contract ${contract.contractId} : Cash ${totalCashAmount} >>>> PaymentHistory ${totalPaymentHistoryAmount}`,
            );
          }),
        );
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { list_receipt_contract, list_receipt_difference },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
