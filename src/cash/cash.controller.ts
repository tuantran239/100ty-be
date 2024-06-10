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
  GroupCashStatus,
  ResponseData,
} from 'src/common/interface';
import { CashQuery } from 'src/common/interface/query';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { mapCashResponse } from 'src/common/utils/map';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { User } from 'src/user/user.entity';
import { Between, Equal, ILike, IsNull, Or } from 'typeorm';
import { CashService } from './cash.service';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

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
    private logActionService: LogActionService,
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

      const cash = await this.cashService.create({
        ...payload,
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
            Equal(CashFilterType.LOAN_MORE_CONTRACT),
            Equal(CashFilterType.DOWN_ROOT_MONEY),
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
}
