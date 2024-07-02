import {
  BadRequestException,
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
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { BaseRouterUrl } from '../constant/router';
import { BaseRepository } from '../repository/base.repository';
import { BaseService } from '../service/base.service';
import { ResponseData } from '../types';
import { checkBodyValid, checkRoleValid } from '../utils/validate';
import { ICheckRole } from '../decorator/roles.decorator';
import { DataSource } from 'typeorm';
import { SoftDeletableEntity } from '../entity/soft-deletable.entity';
import { NewBaseService } from '../service/new-base.service';

@Controller()
export class BaseAuthController<
  E extends SoftDeletableEntity,
  C,
  U,
  Q,
  R,
  CR extends BaseRepository<E, C, U, R>,
  S extends NewBaseService<E, C, U, Q, R, CR>,
> {
  constructor(
    private readonly service: S,
    private readonly repository: CR,
    protected dataSource: DataSource,
    private readonly _i18n: I18nCustomService,
    private readonly dto: {
      CreateDto: C;
      UpdateDto: U;
      QueryDto: Q;
    },
    private roles: {
      create: ICheckRole[];
      update: ICheckRole[];
      list: ICheckRole[];
      retrieve: ICheckRole[];
      remove: ICheckRole[];
      delete: ICheckRole[];
    },
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(BaseRouterUrl.CREATE)
  public async create(
    @Body() payload: C,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const me = req.user as UserResponseDto;

      checkRoleValid(req, this.roles.create, this._i18n, this.dataSource);

      await checkBodyValid(this.dto.CreateDto, payload, this._i18n);

      const newRecord = await this.service.create({ ...payload, me });

      const responseData: ResponseData = {
        message: 'success',
        data: newRecord,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(BaseRouterUrl.UPDATE)
  async update(@Body() payload: U, @Req() req: Request, @Res() res: Response) {
    try {
      const me = req.user as UserResponseDto;

      checkRoleValid(req, this.roles.update, this._i18n, this.dataSource);

      await checkBodyValid(this.dto.UpdateDto, payload, this._i18n);

      const { id } = req.params;

      const updatedRecord = await this.service.update(id, { ...payload, me });

      const responseData: ResponseData = {
        message: 'success',
        data: updatedRecord,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(BaseRouterUrl.LIST)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const me = req.user as UserResponseDto;

      checkRoleValid(req, this.roles.list, this._i18n, this.dataSource);

      await checkBodyValid(this.dto.QueryDto, req.query as Q, this._i18n);

      const query = req.query as Q;

      const data = await this.service.listByQuery({ ...query, me });

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

  @UseGuards(JwtAuthGuard)
  @Get(BaseRouterUrl.RETRIEVE)
  async retrieveById(@Req() req: Request, @Res() res: Response) {
    try {
      const me = req.user as UserResponseDto;

      checkRoleValid(req, this.roles.retrieve, this._i18n, this.dataSource);

      const { id } = req.params;

      const options = { where: { id } } as any;

      const record = await this.service.retrieveMapResponse(options);

      const responseData: ResponseData = {
        message: 'success',
        data: record,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(BaseRouterUrl.REMOVE)
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const me = req.user as UserResponseDto;

      checkRoleValid(req, this.roles.remove, this._i18n, this.dataSource);

      const { id } = req.params;

      const record = await this.service.remove(id);

      const responseData: ResponseData = {
        message: 'success',
        data: record,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(BaseRouterUrl.DELETE)
  async delete(@Req() req: Request, @Res() res: Response) {
    try {
      const me = req.user as UserResponseDto;

      checkRoleValid(req, this.roles.delete, this._i18n, this.dataSource);

      const { id } = req.params;

      const record = await this.service.delete(id);

      const responseData: ResponseData = {
        message: 'success',
        data: record,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}