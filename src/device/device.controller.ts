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
import {  Response } from 'express';
import { RequestCustom } from 'src/common/types/http';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { RoleId } from 'src/role/role.type';
import { DeviceRouter } from './device.router';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { RolesGuard } from 'src/common/guard/roles.guard';

const ENTITY_LOG = 'Device';

@ApiTags('Device')
@Controller(DeviceRouter.ROOT)
export class DeviceController {
  constructor(
    private deviceService: DeviceService,
    private logger: LoggerServerService,
  ) {}

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(DeviceRouter.CREATE)
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(DeviceRouter.UPDATE)
  async updateDevice(
    @Body(new BodyValidationPipe()) payload: UpdateDeviceDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
    {
      id: RoleId.USER,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(DeviceRouter.LIST)
  async listDevice(@Res() res: Response, @Req() req: RequestCustom) {
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(DeviceRouter.RETRIEVE)
  async getDevice(@Res() res: Response, @Req() req: RequestCustom) {
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(DeviceRouter.DELETE)
  async deleteDevice(@Res() res: Response, @Req() req: RequestCustom) {
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
