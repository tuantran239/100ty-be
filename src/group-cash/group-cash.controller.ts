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
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { GroupCashQuery } from 'src/common/types/query';
import { DatabaseService } from 'src/database/database.service';
import { RoleName } from 'src/role/role.type';
import { User } from 'src/user/user.entity';
import { Equal, FindOptionsWhere, Not } from 'typeorm';
import { CreateGroupCashDto } from './dto/create-group-cash.dto';
import { UpdateGroupCashDto } from './dto/update-group-cash.dto';
import { GroupCash } from './entity/group-cash.entity';
import { GroupCashService } from './group-cash.service';
import { GroupCashType } from './group-cash.type';

@Controller(RouterUrl.GROUP_CASH.ROOT)
export class GroupCashController {
  constructor(
    private groupCashService: GroupCashService,
    private databaseService: DatabaseService,
  ) {}

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.GROUP_CASH.CREATE)
  async create(
    @Body(new BodyValidationPipe()) payload: CreateGroupCashDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const me = req?.user as User;

      const newGroupCash = await this.groupCashService.create({
        ...payload,
        userId: me.id,
        me,
      });

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

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
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

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
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

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.GROUP_CASH.LIST)
  async list(@Res() res: Response, @Req() req: Request) {
    try {
      const { userRepository } = this.databaseService.getRepositories();

      const me = req?.user as User;

      const { page, pageSize, status } = req.body as GroupCashQuery;

      const user = userRepository.filterRole(me, true);

      const query: FindOptionsWhere<GroupCash> = {
        type: Not(Equal(GroupCashType.CONTRACT)),
        user,
      };

      const where = [];

      if (status && status.trim().length > 0) {
        where.push({ status, ...query });
      } else {
        where.push({ ...query });
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

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
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
}
