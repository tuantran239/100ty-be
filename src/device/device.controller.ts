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
import RouterUrl from 'src/common/constant/router';
import { ResponseData } from 'src/common/interface';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

const ENTITY_LOG = 'Device';

@ApiTags('Device')
@Controller(RouterUrl.DEVICE.ROOT)
export class DeviceController {
  constructor(
    private deviceService: DeviceService,
    private logger: LoggerServerService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.DEVICE.CREATE)
  async createDevice(
    @Body(new BodyValidationPipe()) payload: CreateDeviceDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const device = await this.deviceService.create({
        ...payload,
      });
      const responseData: ResponseData = {
        message: 'success',
        data: { device },
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
  @Put(RouterUrl.DEVICE.UPDATE)
  async updateDevice(
    @Body(new BodyValidationPipe()) payload: UpdateDeviceDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const id = req.params.id;

      const device = await this.deviceService.update(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { device },
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
  @Post(RouterUrl.DEVICE.LIST)
  async listDevice(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize } = req.body;

      const data = await this.deviceService.listAndCount({
        take: pageSize ?? 100,
        skip: ((page ?? 1) - 1) * (pageSize ?? 100),
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
  @Get(RouterUrl.DEVICE.RETRIEVE)
  async getDevice(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const device = await this.deviceService.retrieveById(id);

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
  @Delete(RouterUrl.DEVICE.DELETE)
  async deleteDevice(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const device = await this.deviceService.delete(id);

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
