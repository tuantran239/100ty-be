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
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { RequestCustom } from 'src/common/types/http';
import { RoleId } from 'src/role/role.type';
import { User } from 'src/user/user.entity';
import { StatisticsContractQueryDto } from './dto/statistics-contract-query.dto';
import { StatisticsProfitQueryDto } from './dto/statistics-profit-query.dto';
import { StatisticsRouter } from './statistics.router';
import { StatisticsService } from './statistics.service';

@Controller(StatisticsRouter.ROOT)
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(StatisticsRouter.HOME_PREVIEW)
  async homePreview(@Res() res: Response, @Req() req: RequestCustom) {
    try {
      const user = req?.user as User;

      const data = await this.statisticsService.homePreview(req.defaultQuery);

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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(StatisticsRouter.NEW_HOME_PREVIEW)
  async newHomePreview(@Res() res: Response, @Req() req: RequestCustom) {
    try {
      const user = req?.user as User;

      const data = await this.statisticsService.statisticNewHomePreview(
        req.defaultQuery,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(StatisticsRouter.PROFIT)
  async statisticsProfit(
    @Body(new BodyValidationPipe()) payload: StatisticsProfitQueryDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
  ) {
    try {
      const me = req?.user as User;

      const data = await this.statisticsService.statisticsProfit({
        ...payload,
        defaultQuery: req.defaultQuery,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(StatisticsRouter.OVERVIEW)
  async statisticsOverview(@Res() res: Response, @Req() req: RequestCustom) {
    try {
      const me = req?.user as User;

      const data = await this.statisticsService.statisticsOverview(
        req.defaultQuery,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(StatisticsRouter.EXPECTED_RECEIPT)
  async statisticsExpectedReceipt(
    @Body(new BodyValidationPipe()) payload: StatisticsContractQueryDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
  ) {
    try {
      const data = await this.statisticsService.statisticsExpectedReceipt(
        payload,
        req.defaultQuery,
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
