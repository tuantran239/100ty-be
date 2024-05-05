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
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LogActionType } from 'src/common/constant/log';
import RouterUrl from 'src/common/constant/router';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import {
  CashFilterType,
  ContractType,
  ResponseData,
  RoleId,
  RoleName,
} from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { PaymentStatusHistory } from 'src/common/interface/history';
import { BatHoQuery } from 'src/common/interface/query';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import {
  createCashContractPayload,
  createPaymentHistoriesCash,
} from 'src/common/utils/cash-payload';
import {
  mapBatHoResponse,
  mapTransactionHistoryResponse,
} from 'src/common/utils/map';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { User } from 'src/user/user.entity';
import { And, Between, Equal, ILike, IsNull, Not, Or } from 'typeorm';
import { BatHoService } from './bat-ho.service';
import { CreateBatHoDto } from './dto/create-bat-ho.dto';
import { ReverseBatHoDto } from './dto/reverse-bat-ho.dto';
import { SettlementBatHoDto } from './dto/settlement-bat-ho.dto';
import { UpdateBatHoDto } from './dto/update-bat-ho.dto';
import { getBatHoStatus } from 'src/common/utils/status';

export const BAT_HO_CODE_PREFIX = 'bh';
const ENTITY_LOG = 'BatHo';

@ApiTags('Bat Ho')
@Controller(RouterUrl.BAT_HO.ROOT)
export class BatHoController {
  constructor(
    private batHoService: BatHoService,
    private logger: LoggerServerService,
    private logActionService: LogActionService,
    private databaseService: DatabaseService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.BAT_HO.CREATE)
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

      const batHo = await this.batHoService.createTransaction(payload, userId);

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Put(RouterUrl.BAT_HO.UPDATE)
  async updateCash(
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.BAT_HO.LIST)
  async listBatHo(@Res() res: Response, @Req() req) {
    try {
      const me = req.user as User;

      const role = me.roles[0];

      let user = undefined;

      const {
        search,
        fromDate,
        toDate,
        page,
        pageSize,
        debitStatus,
        device,
        hostServer,
        receiptToday,
      } = req.body as BatHoQuery;

      let paymentHistories = undefined;

      const where = [];
      const from = fromDate ? fromDate : formatDate(new Date());
      const to = toDate ? toDate : formatDate(new Date());
      const today = formatDate(new Date());

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
          startDate: Equal(convertPostgresDate(today)),
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
        (!debitStatus || (debitStatus as string).trim().length === 0) &&
        (!device || (device as string).trim().length === 0) &&
        (!hostServer || (hostServer as string).trim().length === 0)
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

        if (device) {
          where.push({
            ...query,
            device: {
              name: ILike(device),
            },
          });
        }

        if (hostServer) {
          where.push({
            ...query,
            hostServer: {
              name: ILike(hostServer),
            },
          });
        }
      }

      const data = await this.batHoService.listAndCount({
        relations: [
          'customer',
          'paymentHistories',
          'device',
          'hostServer',
          'user',
        ],
        where: [...where],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
        order: { created_at: 'ASC' },
      });

      const list_bat_ho: any[] = [];

      for (let i = 0; i < data[0].length; i++) {
        const batHo = await this.batHoService.retrieveOne({
          where: { id: data[0][i].id },
          relations: [
            'customer',
            'paymentHistories',
            'device',
            'hostServer',
            'user',
          ],
        });

        if (batHo) {
          list_bat_ho.push({ ...(mapBatHoResponse(batHo) as any)?.batHo });
        }
      }

      const responseData: ResponseData = {
        message: 'success',
        data: { list_bat_ho, total: data[1] },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      console.log(error);
      this.logger.error(
        { loggerType: 'list', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.BAT_HO.RETRIEVE)
  async getBatHo(@Res() res: Response, @Req() req: Request) {
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

      const paymentHistoriesResponse: any[] = paymentHistories.map(
        (paymentHistory) => ({
          id: paymentHistory.id,
          rowId: paymentHistory.rowId,
          paymentStatus: paymentHistory.paymentStatus,
          startDate: formatDate(paymentHistory.startDate),
          endDate: formatDate(paymentHistory.endDate),
          totalPaymentAmount: paymentHistory.payNeed,
          customerPaymentAmount: paymentHistory.payMoney,
          payDate: formatDate(paymentHistory.payDate),
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

  @UseGuards(JwtAuthGuard)
  @Delete(RouterUrl.BAT_HO.DELETE)
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

  @UseGuards(JwtAuthGuard)
  @Delete(RouterUrl.BAT_HO.REMOVE)
  async removeBatHo(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const result = await this.batHoService.remove(id);

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
  @Get(RouterUrl.BAT_HO.INFO)
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

      let latePaymentDay = 0;
      let latePaymentMoney = 0;
      let badDebitMoney = 0;

      const today = formatDate(new Date());

      const lastPaymentHistoryUnfinish = paymentHistories
        .sort((p1, p2) => p1.rowId - p2.rowId)
        .find(
          (paymentHistory) =>
            (paymentHistory.paymentStatus == PaymentStatusHistory.UNFINISH ||
              paymentHistory.paymentStatus == null) &&
            formatDate(paymentHistory.startDate) !== today &&
            new Date(paymentHistory.startDate).getTime() <
              new Date(convertPostgresDate(today)).getTime(),
        );

      if (lastPaymentHistoryUnfinish) {
        latePaymentDay = Math.round(
          (new Date(convertPostgresDate(today)).getTime() -
            new Date(lastPaymentHistoryUnfinish.startDate).getTime()) /
            86400000,
        );

        latePaymentMoney = paymentHistories
          .sort((p1, p2) => p1.rowId - p2.rowId)
          .reduce((total, paymentHistory) => {
            if (
              (paymentHistory.paymentStatus == PaymentStatusHistory.UNFINISH ||
                paymentHistory.paymentStatus == null) &&
              formatDate(paymentHistory.startDate) !== today &&
              new Date(paymentHistory.startDate).getTime() <
                new Date(convertPostgresDate(today)).getTime()
            ) {
              return paymentHistory.payNeed + total;
            }
            return total;
          }, 0);
      }

      if (batHo.debitStatus == DebitStatus.BAD_DEBIT) {
        badDebitMoney = paymentHistories.reduce((total, paymentHistory) => {
          if (paymentHistory.paymentStatus != PaymentStatusHistory.FINISH) {
            return total + paymentHistory.payNeed;
          }
          return total;
        }, 0);
      }

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

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.BAT_HO.CLOSE)
  async closeBatHo(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const result = await this.batHoService.update(id, {
        debitStatus: DebitStatus.COMPLETED as string,
      });

      await this.batHoService.delete(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { batHo: result },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.BAT_HO.CHECK_UPDATE)
  async checkAndUpdateCash(@Res() res: Response) {
    try {
      await this.batHoService.checkUpdateBatHoDebitStatus();

      const responseData: ResponseData = {
        message: 'success',
        data: null,
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

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.BAT_HO.SETTLEMENT)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.BAT_HO.REVERSE_CONTRACT)
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

      await this.batHoService.settlementBatHo(id, { payDate });

      const createBatHoPayload: CreateBatHoDto = {
        customerId: batHo.customerId,
        deviceId: batHo.deviceId,
        hostServerId: batHo.hostServerId,
        ...dataLoan,
        loanDate: convertPostgresDate(dataLoan?.loanDate ?? payDate),
        contractId,
        oldContractId: batHo.id,
      };

      const newBatHo = await this.batHoService.createTransaction(
        createBatHoPayload,
        req?.user?.user_id ?? '',
      );

      await this.batHoService.update(id, {
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

  @UseGuards(JwtAuthGuard)
  @Post('group-cash')
  async groupCashBatHo(@Res() res: Response) {
    try {
      await this.batHoService.groupCashBatHo();

      const responseData: ResponseData = {
        message: 'success',
        data: null,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error({ customerMessage: 'Group cash bat ho ' }, null);
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('separate-deduction-cash')
  async separateDeductionCashBatHo(@Res() res: Response) {
    try {
      await this.batHoService.separateDeductionCashBatHo();

      const responseData: ResponseData = {
        message: 'success',
        data: null,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { customerMessage: 'Separate deduction cash bat ho ' },
        null,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/convert-receipt-cash')
  async convertReceiptCash(@Res() res: Response) {
    try {
      await this.databaseService.runTransaction(async (repositories) => {
        const { batHoRepository, cashRepository } = repositories;

        const batHos = await batHoRepository.find({
          relations: ['user', 'customer', 'paymentHistories'],
        });

        for (let i = 0; i < batHos.length; i++) {
          const batHo = batHos[i];

          const receiptCash = await cashRepository.findOne({
            where: {
              batHoId: batHo.id,
              filterType: CashFilterType.RECEIPT_CONTRACT,
            },
          });

          if (!receiptCash) {
            console.log(batHo.id);

            const newCashReceipt = await cashRepository.create({
              ...createCashContractPayload(
                batHo.user,
                batHo.customer,
                CashFilterType.RECEIPT_CONTRACT,
                {
                  id: batHo.id,
                  amount: 0,
                  date: formatDate(batHo.loanDate),
                  contractType: ContractType.BAT_HO,
                  contractId: batHo.contractId,
                },
              ),
              paymentHistories: createPaymentHistoriesCash(
                batHo.paymentHistories,
              ),
              contractId: batHo.contractId,
              contractStatus: batHo.debitStatus,
            });

            console.log(newCashReceipt);

            await cashRepository.save(newCashReceipt);
          }
        }
      });

      const responseData: ResponseData = {
        message: 'success',
        data: null,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error({ customerMessage: 'Convert receipt cash' }, null);
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/update-status')
  async updateStatus(@Res() res: Response) {
    try {
      await this.databaseService.runTransaction(async (repositories) => {
        const {
          batHoRepository,
          customerRepository,
          cashRepository,
          paymentHistoryRepository,
        } = repositories;

        const batHos = await batHoRepository.find({
          where: {
            deleted_at: IsNull(),
          },
          relations: ['paymentHistories'],
        });

        await Promise.all(
          batHos.map(async (batHo) => {
            const customer = await customerRepository.findOne({
              where: { id: batHo.customerId },
            });

            const status = getBatHoStatus(batHo.paymentHistories ?? []);

            if (
              status == DebitStatus.BAD_DEBIT ||
              status == DebitStatus.RISK_DEBIT
            ) {
              const debtMoney = batHo.paymentHistories.reduce(
                (total, paymentHistory) => {
                  if (
                    paymentHistory.paymentStatus != PaymentStatusHistory.FINISH
                  ) {
                    return total + paymentHistory.payNeed;
                  }
                  return total;
                },
                0,
              );

              await customerRepository.update(customer.id, {
                debtMoney,
                isDebt: true,
              });
            } else {
              await customerRepository.update(customer.id, {
                debtMoney: 0,
                isDebt: false,
              });
            }

            await batHoRepository.update(
              { id: batHo.id },
              { debitStatus: status },
            );

            const findPaymentHistories = await paymentHistoryRepository.find({
              where: { batHoId: batHo.id },
            });

            const cash = await cashRepository.findOne({
              where: {
                batHoId: batHo.id,
                filterType: CashFilterType.RECEIPT_CONTRACT,
              },
            });

            if (cash) {
              cash.contractStatus = status;

              cash.paymentHistories = createPaymentHistoriesCash(
                findPaymentHistories ?? [],
              );

              await cashRepository.save(cash);
            }
          }),
        );
      });

      const responseData: ResponseData = {
        message: 'success',
        data: null,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { customerMessage: 'Separate deduction cash bat ho ' },
        null,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

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
