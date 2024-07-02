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
    UsePipes,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { BaseRouterUrl } from '../constant/router';
import { BodyValidationPipe } from '../pipe/body-validation.pipe';
import { BaseRepository } from '../repository/base.repository';
import { NewBaseService } from '../service/new-base.service';
import { ResponseData } from '../types';
import { checkBodyValid } from '../utils/validate';
import { SoftDeletableEntity } from '../database/soft-deletable.entity';

@Controller()
export class BaseController<
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
    private readonly _i18n: I18nCustomService,
    private readonly dto: {
      CreateDto: C;
      UpdateDto: U;
      QueryDto: Q;
    },
    private isDeleteDatabase: boolean = false,
  ) {
    this.isDeleteDatabase = isDeleteDatabase;
  }

  @Post(BaseRouterUrl.CREATE)
  @UsePipes(BodyValidationPipe)
  public async create(@Body() payload: C, @Res() res: Response) {
    try {
      await checkBodyValid(this.dto.CreateDto, payload, this._i18n);

      const newRecord = await this.service.create(payload);

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

  @Put(BaseRouterUrl.UPDATE)
  async update(
    @Body(BodyValidationPipe) payload: U,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await checkBodyValid(this.dto.UpdateDto, payload, this._i18n);

      const { id } = req.params;

      const updatedRecord = await this.service.update(id, payload);

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

  @Get(BaseRouterUrl.LIST)
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      await checkBodyValid(this.dto.QueryDto, req.query as Q, this._i18n);

      const query = req.query as Q;

      const data = await this.service.list(query);

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

  @Get(BaseRouterUrl.RETRIEVE)
  async retrieveById(@Req() req: Request, @Res() res: Response) {
    try {
      const { id } = req.params;

      const options = { where: { id } } as any;

      const record = await this.service.retrieve(options);

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

  @Put(BaseRouterUrl.REMOVE)
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
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

  @Delete(BaseRouterUrl.DELETE)
  async delete(@Req() req: Request, @Res() res: Response) {
    try {
      if (!this.isDeleteDatabase) {
        throw new Error('Method not supported');
      }

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
