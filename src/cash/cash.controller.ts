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
import { InjectRepository } from '@nestjs/typeorm';
import {  Response } from 'express';
import { RequestCustom } from 'src/common/types/http';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LogActionType } from 'src/common/constant/log';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { RoleId, RoleName } from 'src/role/role.type';
import { User } from 'src/user/user.entity';
import { Cash } from './cash.entity';
import { CashRepository } from './cash.repository';
import { CashRouter } from './cash.router';
import { CashService } from './cash.service';
import { CreateCashDto } from './dto/create-cash.dto';
import { ListCashQueryDto } from './dto/list-cash-query.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

const ENTITY_LOG = 'Cash';
@ApiTags('Cash')
@Controller(CashRouter.ROOT)
export class CashController {
  constructor(
    private cashService: CashService,
    private logger: LoggerServerService,
    private logActionService: LogActionService,
    @InjectRepository(Cash)
    private readonly cashRepository: CashRepository,
  ) {}

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN,
    }
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(CashRouter.CREATE)
  async createCash(
    @Body(new BodyValidationPipe()) payload: CreateCashDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const me = req.user;

      this.logger.log(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );

      const cash = await this.cashService.create({
        ...payload,
        userId: me.id,
      });

      this.logActionService.create({
        userId: me.id,
        action: LogActionType.CREATE_CASH,
        agent: { agent: req.get('user-agent') },
        data: { ...cash },
        payload: { ...payload },
        workspaceId: payload.workspaceId
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { cash: this.cashRepository.mapCashResponse(cash) },
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
      entity: new Cash(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(CashRouter.UPDATE)
  async updateCash(
    @Body(new BodyValidationPipe()) payload: UpdateCashDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
  ) {
    try {
      const me = req.user;

      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        payload,
      );
      const id = req.params.id;

      const cash = await this.cashService.update(id, payload);

      this.logActionService.create({
        userId: me.id,
        action: LogActionType.UPDATE_CASH,
        agent: { agent: req.get('user-agent') },
        data: { ...cash },
        payload: { ...payload },
        workspaceId: payload.workspaceId
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { cash },
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
      entity: new Cash(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(CashRouter.LIST)
  async listCash(
    @Body(new BodyValidationPipe()) payload: ListCashQueryDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
  ) {
    try {

      const me = req.user;

      const data = await this.cashService.listCash(payload, me)

      const responseData: ResponseData = {
        message: 'success',
        data,
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
      entity: new Cash(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(CashRouter.RETRIEVE)
  async getCash(@Res() res: Response, @Req() req: RequestCustom) {
    try {
      const id = req.params.id;

      const cash = await this.cashService.retrieveById(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { cash: this.cashRepository.mapCashResponse(cash) },
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
      entity: new Cash(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(CashRouter.DELETE)
  async deleteCash(@Res() res: Response, @Req() req: RequestCustom) {
    try {
      const me = req.user;

      const id = req.params.id;

      const cash = await this.cashService.delete(id);

      this.logActionService.create({
        userId: me.id,
        action: LogActionType.DELETE_CASH,
        agent: { agent: req.get('user-agent') },
        data: { ...cash },
        payload: { id },
        workspaceId: me.workspaceId
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { cash },
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
