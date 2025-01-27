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
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { CreateHostServerDto } from './dto/create-host-server.dto';
import { UpdateHostServerDto } from './dto/update-host-server.dto';
import { HostServerRouter } from './host-server.router';
import { HostServerService } from './host-server.service';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { RoleId } from 'src/role/role.type';
import { HostServer } from './host-server.entity';

const ENTITY_LOG = 'HostServer';

@ApiTags('HostServer')
@Controller(HostServerRouter.ROOT)
export class HostServerController {
  constructor(
    private hostServerService: HostServerService,
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
  @UseGuards(JwtAuthGuard)
  @Post(HostServerRouter.CREATE)
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new HostServer(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard)
  @Put(HostServerRouter.UPDATE)
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new HostServer(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard)
  @Post(HostServerRouter.LIST)
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new HostServer(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard)
  @Get(HostServerRouter.RETRIEVE)
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
      entity: new HostServer(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard)
  @Delete(HostServerRouter.DELETE)
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
