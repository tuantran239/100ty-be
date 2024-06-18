import {
  Controller,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LogActionService } from './log-action.service';
import RouterUrl from 'src/common/constant/router';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LogActionQuery } from 'src/common/types/query';
import { ResponseData } from 'src/common/types';
import { Response } from 'express';

@Controller(RouterUrl.LOG_ACTION.ROOT)
export class LogActionController {
  constructor(private logActionService: LogActionService) {}

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.LOG_ACTION.LIST)
  async listDevice(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize, type } = req.body as LogActionQuery;

      const where = [];

      if (type) {
        where.push({ type });
      }

      const data = await this.logActionService.listAndCount({
        where,
        take: pageSize ?? 100,
        skip: ((page ?? 1) - 1) * (pageSize ?? 100),
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { list_log_action: data[0], total: data[1] },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
