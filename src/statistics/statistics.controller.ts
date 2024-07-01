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
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { RoleName } from 'src/role/role.type';
import { User } from 'src/user/user.entity';
import { StatisticsContractQueryDto } from './dto/statistics-contract-query.dto';
import { StatisticsProfitQueryDto } from './dto/statistics-profit-query.dto';
import { StatisticsRouter } from './statistics.router';
import { StatisticsService } from './statistics.service';

@Controller(StatisticsRouter.ROOT)
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(StatisticsRouter.HOME_PREVIEW)
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
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(StatisticsRouter.NEW_HOME_PREVIEW)
  async newHomePreview(@Res() res: Response, @Req() req) {
    try {
      const user = req?.user as User;

      const data = await this.statisticsService.statisticNewHomePreview(user);

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
  @Post(StatisticsRouter.PROFIT)
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
  @Get(StatisticsRouter.OVERVIEW)
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
  @Post(StatisticsRouter.EXPECTED_RECEIPT)
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
