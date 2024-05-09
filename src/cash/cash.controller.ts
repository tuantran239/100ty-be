import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
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
import {
  CashFilterType,
  CashType,
  ContractType,
  GroupCashStatus,
  ResponseData,
  RoleName,
} from 'src/common/interface';
import { CashQuery } from 'src/common/interface/query';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { createPaymentHistoriesCash } from 'src/common/utils/cash-payload';
import { generatePrefixNumberId } from 'src/common/utils/generated-id';
import { getFullName } from 'src/common/utils/get-full-name';
import { mapCashResponse } from 'src/common/utils/map';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { User } from 'src/user/user.entity';
import { Between, DataSource, Equal, ILike, IsNull, Or } from 'typeorm';
import { CashService } from './cash.service';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { GROUP_CASH_INIT_DATA } from 'src/group-cash/group-cash.controller';

export const CASH_CODE_PREFIX = 'c';
const ENTITY_LOG = 'Cash';

export const filterTypesData = {
  receipt: [
    {
      label: 'Tiền quỹ',
      value: CashFilterType.INIT,
    },
    {
      label: 'Tiền thu khác',
      value: CashFilterType.RECEIPT_ORTHER,
    },
  ],
  payment: [
    {
      label: 'Phí hồ sơ',
      value: CashFilterType.SERVICE_FEE,
    },
    {
      label: 'Tiền cộng tác viên',
      value: CashFilterType.PARTNER,
    },
    {
      label: 'Tiền lương nhân viên',
      value: CashFilterType.PAY_ROLL,
    },
    {
      label: 'Chi tiêu khác',
      value: CashFilterType.PAYMENT_ORTHER,
    },
  ],
};

@ApiTags('Cash')
@Controller(RouterUrl.CASH.ROOT)
export class CashController {
  constructor(
    private cashService: CashService,
    private logger: LoggerServerService,
    private dataSource: DataSource,
    private logActionService: LogActionService,
    private databaseService: DatabaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.CASH.CREATE)
  async createCash(
    @Body(new BodyValidationPipe()) payload: CreateCashDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const me = req.user as User;

      this.logger.log(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );

      if (!payload.groupId) {
        throw new Error('Vui lòng chọn nhóm thu chi cho phiếu');
      }

      const cash = await this.cashService.create({
        ...payload,
        code: generatePrefixNumberId(CASH_CODE_PREFIX),
        createAt: convertPostgresDate(payload.createAt as any),
      });

      this.logActionService.create({
        userId: me.id,
        action: LogActionType.CREATE_CASH,
        agent: { agent: req.get('user-agent') },
        data: { ...cash },
        payload: { ...payload },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: mapCashResponse(cash),
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

  @UseGuards(JwtAuthGuard)
  @Put(RouterUrl.CASH.UPDATE)
  async updateCash(
    @Body(new BodyValidationPipe()) payload: UpdateCashDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const me = req.user as User;

      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const id = req.params.id;

      const cash = await this.cashService.update(id, payload);

      this.logActionService.create({
        userId: me.id,
        action: LogActionType.UPDATE_CASH,
        agent: { agent: req.get('user-agent') },
        data: { ...cash },
        payload: { ...payload },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { cash },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.CASH.LIST)
  async listCash(@Res() res: Response, @Req() req: Request) {
    try {
      const {
        traders,
        staff,
        fromDate,
        toDate,
        page,
        pageSize,
        contractType,
        type,
        groupId,
        isContract,
      } = req.body as CashQuery;

      const where = [];
      const from = fromDate ? fromDate : formatDate(new Date());
      const to = toDate ? toDate : formatDate(new Date());

      let filterCashQuery: any = {};

      if (isContract) {
        filterCashQuery = {
          filterType: Or(
            Equal(CashFilterType.PAYMENT_CONTRACT),
            Equal(CashFilterType.RECEIPT_CONTRACT),
          ),
        };
      } else if (groupId && groupId.trim().length > 0) {
        filterCashQuery = {
          groupId,
        };
      }

      const query = {
        createAt: Between(convertPostgresDate(from), convertPostgresDate(to)),
        deleted_at: IsNull(),
        contractType: contractType,
        type: type == null ? undefined : type,
        ...filterCashQuery,
        isContract: isContract ? Equal(true) : Or(Equal(false), IsNull()),
        group: isContract
          ? undefined
          : {
              status: GroupCashStatus.ACTIVE,
            },
      };

      if (
        (!traders || (traders as string).trim().length === 0) &&
        (!staff || (staff as string).trim().length === 0)
      ) {
        where.push({
          ...query,
        });
      } else {
        if (traders) {
          where.push({
            ...query,
            traders: ILike(traders as string),
          });
        }
        if (staff) {
          where.push({
            ...query,
            staff: ILike(staff as string),
          });
        }
      }

      const data = await this.cashService.listAndCount({
        where: [...where],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
        order: { createAt: 'DESC' },
        relations: [
          'batHo',
          'batHo.user',
          'batHo.customer',
          'batHo.user.manager',
          'group',
          'pawn',
          'pawn.user',
          'pawn.customer',
          'pawn.user.manager',
        ],
      });

      const result = await this.cashService.list({
        where: [...where],
      });

      const count = {
        payment: result.reduce((total, cash) => {
          if (cash.type === CashType.PAYMENT) {
            return total + cash.amount;
          }
          return total;
        }, 0),
        receipt: result.reduce((total, cash) => {
          if (cash.type === CashType.RECEIPT) {
            return total + cash.amount;
          }
          return total;
        }, 0),
      };

      data[0] = data[0].map((cash) => ({
        ...(mapCashResponse(cash) as any)?.cash,
      }));

      const responseData: ResponseData = {
        message: 'success',
        data: { list_cash: data[0], total: data[1], count },
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
  @Get(RouterUrl.CASH.RETRIEVE)
  async getCash(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const cash = await this.cashService.retrieveById(id);

      const responseData: ResponseData = {
        message: 'success',
        data: mapCashResponse(cash),
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
  @Delete(RouterUrl.CASH.DELETE)
  async deleteCash(@Res() res: Response, @Req() req: Request) {
    try {
      const me = req.user as User;

      const id = req.params.id;

      const cash = await this.cashService.delete(id);

      this.logActionService.create({
        userId: me.id,
        action: LogActionType.DELETE_CASH,
        agent: { agent: req.get('user-agent') },
        data: { ...cash },
        payload: { id },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { cash },
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
  @Get(RouterUrl.CASH.TOTAL)
  async totalCash(@Res() res: Response) {
    try {
      const total = await this.cashService.getTotalCash();

      const responseData: ResponseData = {
        message: 'success',
        data: total,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      this.logger.error(
        {
          customerMessage: '[GetTotalCash]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/convert-service-fee')
  async convertServiceFee(@Res() res: Response) {
    try {
      await this.databaseService.runTransaction(async (repositories) => {
        const { batHoRepository, cashRepository } = repositories;

        const batHos = await batHoRepository.find({
          relations: ['user', 'customer'],
        });

        await Promise.all(
          batHos.map(async (batHo) => {
            const user = batHo.user;
            const customer = batHo.customer;

            const newCash = await cashRepository.create({
              staff: user?.fullName ?? user?.username,
              traders:
                getFullName(customer?.firstName, customer?.lastName) ?? '',
              type: CashType.PAYMENT,
              amount: batHo.serviceFee?.value ?? 0,
              createAt: batHo.loanDate,
              code: generatePrefixNumberId(CASH_CODE_PREFIX),
              batHoId: batHo.id,
              isContract: true,
              contractType: ContractType.BAT_HO,
              isServiceFee: true,
              note: `Thu tiền phí làm hợp đồng ${batHo.contractId}`,
              userId: user?.id,
            });

            await cashRepository.save(newCash);
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
        {
          customerMessage: '[Convert cash fee service]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/convert-user')
  async convertCashUser(@Res() res: Response) {
    try {
      await this.databaseService.runTransaction(async (repositories) => {
        const { cashRepository } = repositories;

        const cashes = await cashRepository.find({
          where: {
            userId: IsNull(),
            isContract: true,
          },
          relations: ['batHo', 'batHo.user'],
        });

        await Promise.all(
          cashes.map(async (cash) => {
            cash.userId = cash.batHo.userId;
            await cashRepository.save(cash);
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
        {
          customerMessage: '[Convert cash user]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/convert-filter-type')
  async convertCashFilterType(@Res() res: Response) {
    try {
      await this.databaseService.runTransaction(async (repositories) => {
        const { cashRepository } = repositories;

        const cashes = await cashRepository.find();

        await Promise.all(
          cashes.map(async (cash) => {
            if (!cash.isContract) {
              if (cash.isInitCash) {
                cash.filterType = CashFilterType.INIT;
              } else if (cash.type === CashType.PAYMENT) {
                cash.filterType = CashFilterType.PAYMENT_ORTHER;
              } else if (cash.type === CashType.RECEIPT) {
                cash.filterType = CashFilterType.RECEIPT_ORTHER;
              }
            } else {
              if (cash.isDeductionMoney) {
                cash.filterType = CashFilterType.DEDUCTION;
              } else if (cash.isServiceFee) {
                cash.filterType = CashFilterType.SERVICE_FEE;
              } else if (cash.isPartner) {
                cash.filterType = CashFilterType.PARTNER;
              } else {
                if (cash.type === CashType.PAYMENT) {
                  cash.filterType = CashFilterType.PAYMENT_CONTRACT;
                } else if (cash.type === CashType.RECEIPT) {
                  cash.filterType = CashFilterType.RECEIPT_CONTRACT;
                }
              }
            }
            await cashRepository.save(cash);
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
        {
          customerMessage: '[Convert cash user]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/convert-payment-history')
  async convertPaymentHistoriesCash(@Res() res: Response) {
    try {
      await this.databaseService.runTransaction(async (repositories) => {
        const { cashRepository } = repositories;

        const cashes = await cashRepository.find({
          where: {
            filterType: Equal(CashFilterType.RECEIPT_CONTRACT),
          },
          relations: ['batHo', 'batHo.paymentHistories'],
        });

        await Promise.all(
          cashes.map(async (cash) => {
            cash.paymentHistories = createPaymentHistoriesCash(
              cash.batHo?.paymentHistories ?? [],
            );
            cash.contractId = cash.batHo?.contractId;
            cash.contractStatus = cash.batHo?.debitStatus;
            await cashRepository.save(cash);
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
        {
          customerMessage: '[Convert cash user]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.CASH.FILTER_TYPE)
  async getCashFilterType(@Res() res: Response) {
    try {
      const responseData: ResponseData = {
        message: 'success',
        data: { filterTypesData },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error) {
      this.logger.error(
        {
          customerMessage: '[Get cash filter type]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/delete/cash-contract-outside')
  async deleteCashContractOutside(@Res() res: Response) {
    try {
      let feeServiceDeleted = 0;
      let partnerDeleted = 0;

      let totalFeeServiceCash = 0;
      let totalPartnerCash = 0;

      await this.databaseService.runTransaction(async (repositories) => {
        const { cashRepository } = repositories;

        const totalFeeService = await cashRepository.find({
          where: { isContract: Equal(true), isServiceFee: Equal(true) },
        });

        const totalPartner = await cashRepository.find({
          where: { isContract: Equal(true), isPartner: Equal(true) },
        });

        totalFeeServiceCash = totalFeeService.length;
        totalPartnerCash = totalPartner.length;

        await Promise.all(
          totalFeeService.map(async (feeService) => {
            await cashRepository.delete({ id: feeService.id });
            feeServiceDeleted++;
          }),
        );

        await Promise.all(
          totalPartner.map(async (partner) => {
            await cashRepository.delete({ id: partner.id });
            partnerDeleted++;
          }),
        );
      });

      const responseData: ResponseData = {
        message: 'success',
        data: {
          feeServiceDeleted: `${feeServiceDeleted}/${totalFeeServiceCash}`,
          partnerDeleted: `${partnerDeleted}/${totalPartnerCash}`,
        },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error) {
      this.logger.error(
        {
          customerMessage: '[Get cash filter type]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/convert-to-group-cash')
  async convertToGroupCash(@Res() res: Response) {
    try {
      let cashConverted = 0;
      let totalCashOutSite = 0;

      await this.databaseService.runTransaction(async (repositories) => {
        let types = [];

        for (let i = 0; i < GROUP_CASH_INIT_DATA.length; i++) {
          types = types.concat(types, GROUP_CASH_INIT_DATA[i]);
        }

        const { cashRepository } = repositories;

        const totalCash = await cashRepository.find({
          where: { isContract: Or(Equal(false), IsNull()) },
        });

        totalCashOutSite = totalCash.length;

        await Promise.all(
          totalCash.map(async (cash) => {
            if (cash.filterType === CashFilterType.SERVICE_FEE) {
              cash.groupId = types[CashFilterType.SERVICE_FEE] ?? 'phi_ho_so';
            } else if (cash.filterType === CashFilterType.PARTNER) {
              cash.groupId = types[CashFilterType.PARTNER] ?? 'ctv';
            } else if (cash.filterType === CashFilterType.PAY_ROLL) {
              cash.groupId = types[CashFilterType.PAY_ROLL] ?? 'luong_nv';
            } else if (cash.filterType === CashFilterType.PAYMENT_ORTHER) {
              cash.groupId =
                types[CashFilterType.PAYMENT_ORTHER] ?? 'chi_tieu_khac';
            } else if (cash.filterType === CashFilterType.INIT) {
              cash.groupId = types[CashFilterType.INIT] ?? 'tien_quy';
            }
            await cashRepository.save(cash);
            cashConverted++;
          }),
        );
      });

      const responseData: ResponseData = {
        message: 'success',
        data: {
          cashConverted: `${cashConverted}/${totalCashOutSite}`,
        },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error) {
      this.logger.error(
        {
          customerMessage: '[Get cash filter type]',
          entity: ENTITY_LOG,
          serverType: 'error',
        },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
