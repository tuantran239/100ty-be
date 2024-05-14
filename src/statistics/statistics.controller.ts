import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import RouterUrl from 'src/common/constant/router';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ResponseData, RoleId, RoleName } from 'src/common/interface';
import {
  BaseQuery,
  StatisticsContractQuery,
  StatisticsFeeServiceQuery,
} from 'src/common/interface/query';
import { User } from 'src/user/user.entity';
import { FindManyOptions, IsNull, Not } from 'typeorm';
import { StatisticsService } from './statistics.service';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { StatisticsProfitQueryDto } from './dto/statistics-profit-query.dto';
import { StatisticsContractQueryDto } from './dto/statistics-contract-query.dto';

@Controller(RouterUrl.STATISTICS.ROOT)
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.STATISTICS.FEE_SERVICE)
  async listFeeService(@Res() res: Response, @Req() req) {
    try {
      const user = req?.user as User;

      const { page, pageSize, type } = req.body as StatisticsFeeServiceQuery;

      const options: FindManyOptions<User> = {
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
      };

      const data = await this.statisticsService.serviceFee(user, options, type);

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.STATISTICS.PARTNER)
  async listPartnerContract(@Res() res: Response, @Req() req) {
    try {
      const me = req?.user as User;

      const role = me.roles[0];

      let user = undefined;

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

      const query = {
        user,
        partner: Not(IsNull()),
      };

      const { page, pageSize } = req.body as BaseQuery;

      const options: FindManyOptions<BatHo> = {
        where: [{ ...query }],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
      };

      const data = await this.statisticsService.listPartnerContract(options);

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.STATISTICS.HOME_PREVIEW)
  async homePreview(@Res() res: Response, @Req() req) {
    try {
      const user = req?.user as User;

      const data = await this.statisticsService.homePreview(user);

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.STATISTICS.STATISTICS_CONTRACT)
  async statisticsContract(@Res() res: Response, @Req() req) {
    try {
      const me = req?.user as User;

      const query = req.body as StatisticsContractQuery;

      const data = await this.statisticsService.statisticsContract(me, query);

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.STATISTICS.PROFIT)
  async statisticsProfit(
    @Body(new BodyValidationPipe()) payload: StatisticsProfitQueryDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const me = req?.user as User;

      const data = await this.statisticsService.statisticsProfit({
        ...payload,
        me,
      });

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.STATISTICS.OVERVIEW)
  async statisticsOverview(@Res() res: Response, @Req() req) {
    try {
      const me = req?.user as User;

      const data = await this.statisticsService.statisticsOverview(me);

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.STATISTICS.EXPECTED_RECEIPT)
  async statisticsExpectedReceipt(
    @Body(new BodyValidationPipe()) payload: StatisticsContractQueryDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const me = req?.user as User;

      const data = await this.statisticsService.statisticsExpectedReceipt(
        payload,
        me,
      );

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
