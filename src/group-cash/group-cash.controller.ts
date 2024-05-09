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
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import RouterUrl from 'src/common/constant/router';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { CashFilterType, ResponseData, RoleName } from 'src/common/interface';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { CreateGroupCashDto } from './dto/create-group-cash.dto';
import { GroupCashService } from './group-cash.service';
import { UpdateGroupCashDto } from './dto/update-group-cash.dto';
import { GroupCashQuery } from 'src/common/interface/query';
import { DatabaseService } from 'src/database/database.service';
import { GroupCashId } from 'src/common/constant/group-cash';

export const GROUP_CASH_INIT_DATA = [
  {
    id: GroupCashId.SERVICE_FEE,
    groupName: 'Phí hồ sơ',
    filterType: CashFilterType.SERVICE_FEE,
    cashType: 'payment',
  },
  {
    id: GroupCashId.PARTNER,
    groupName: 'Tiền cộng tác viên',
    filterType: CashFilterType.PARTNER,
    cashType: 'payment',
  },
  {
    id: GroupCashId.PAY_ROLL,
    groupName: 'Tiền lương nhân viên',
    filterType: CashFilterType.PAY_ROLL,
    cashType: 'payment',
  },
  {
    id: GroupCashId.PAYMENT_ORTHER,
    groupName: 'Chi tiêu khác',
    filterType: CashFilterType.PAYMENT_ORTHER,
    cashType: 'payment',
  },
  {
    id: GroupCashId.INIT,
    groupName: 'Tiền quỹ',
    filterType: CashFilterType.INIT,
    cashType: 'receipt',
  },
];

@Controller(RouterUrl.GROUP_CASH.ROOT)
export class GroupCashController {
  constructor(
    private groupCashService: GroupCashService,
    private databaseService: DatabaseService,
  ) {}

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.GROUP_CASH.CREATE)
  async create(
    @Body(new BodyValidationPipe()) payload: CreateGroupCashDto,
    @Res() res: Response,
  ) {
    try {
      const newGroupCash = await this.groupCashService.create(payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { groupCash: newGroupCash },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(RouterUrl.GROUP_CASH.UPDATE)
  async update(
    @Body(new BodyValidationPipe()) payload: UpdateGroupCashDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { id } = req.params;

      const newGroupCashType = await this.groupCashService.update(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { groupCashType: newGroupCashType },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(RouterUrl.GROUP_CASH.DELETE)
  async delete(@Res() res: Response, @Req() req: Request) {
    try {
      const { id } = req.params;

      const newGroupCashType = await this.groupCashService.delete(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { groupCashType: newGroupCashType },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.GROUP_CASH.LIST)
  async list(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize, status } = req.body as GroupCashQuery;

      const where = [];

      if (status && status.trim().length > 0) {
        where.push({ status });
      }

      const data = await this.groupCashService.listAndCount({
        where,
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
        order: {
          created_at: 'ASC',
        },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { list_group: data[0], total: data[1] },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(RouterUrl.GROUP_CASH.RETRIEVE)
  async getById(@Res() res: Response, @Req() req: Request) {
    try {
      const { id } = req.params;

      const groupCash = await this.groupCashService.retrieveOne({
        where: { id },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { groupCash },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/create-init-data')
  async createInitData(@Res() res: Response) {
    try {
      let group_created = 0;

      await this.databaseService.runTransaction(async (repositories) => {
        const { groupCashRepository } = repositories;
        await Promise.all(
          GROUP_CASH_INIT_DATA.map(async (groupCash) => {
            const groupCashFind = await groupCashRepository.findOne({
              where: { id: groupCash.id },
            });

            if (!groupCashFind) {
              const newGroupCash = await groupCashRepository.create(groupCash);
              await groupCashRepository.save(newGroupCash);

              group_created++;
            }
          }),
        );
      });

      const responseData: ResponseData = {
        message: 'success',
        data: {
          group_created: `${group_created}/${GROUP_CASH_INIT_DATA.length}`,
        },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
