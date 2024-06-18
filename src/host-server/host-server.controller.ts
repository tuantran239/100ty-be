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
import RouterUrl from 'src/common/constant/router';
import { HostServerService } from './host-server.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { CreateHostServerDto } from './dto/create-host-server.dto';
import { Request, Response } from 'express';
import { ResponseData } from 'src/common/types';
import { UpdateHostServerDto } from './dto/update-host-server.dto';

const ENTITY_LOG = 'HostServer';

@ApiTags('HostServer')
@Controller(RouterUrl.HOST_SERVER.ROOT)
export class HostServerController {
  constructor(
    private hostServerService: HostServerService,
    private logger: LoggerServerService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.HOST_SERVER.CREATE)
  async createHostServer(
    @Body(new BodyValidationPipe()) payload: CreateHostServerDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const hostServer = await this.hostServerService.create({
        ...payload,
      });
      const responseData: ResponseData = {
        message: 'success',
        data: { hostServer },
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
  @Put(RouterUrl.HOST_SERVER.UPDATE)
  async updateDevice(
    @Body(new BodyValidationPipe()) payload: UpdateHostServerDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const id = req.params.id;

      const hostServer = await this.hostServerService.update(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { hostServer },
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
  @Post(RouterUrl.HOST_SERVER.LIST)
  async listDevice(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize } = req.body;

      const data = await this.hostServerService.listAndCount({
        take: pageSize ?? 9999999,
        skip: ((page ?? 1) - 1) * (pageSize ?? 9999999),
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { list_device: data[0], total: data[1] },
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
  @Get(RouterUrl.HOST_SERVER.RETRIEVE)
  async getDevice(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const device = await this.hostServerService.retrieveById(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { device },
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
  @Delete(RouterUrl.HOST_SERVER.DELETE)
  async deleteDevice(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const device = await this.hostServerService.delete(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { device },
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
}
