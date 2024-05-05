import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Put,
  Res,
  UseGuards,
  Req,
  Delete,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import RouterUrl from 'src/common/constant/router';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ResponseData, RoleName } from 'src/common/interface';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { AssetTypeService } from './asset-type.service';
import { CreateAssetTypeDto } from './dto/crerate-asset-type.dto';
import { Request, Response } from 'express';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { GroupCashQuery } from 'src/common/interface/query';

@Controller(RouterUrl.ASSET_TYPE.ROOT)
export class AssetTypeController {
  constructor(private assetTypeService: AssetTypeService) {}

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.ASSET_TYPE.CREATE)
  async create(
    @Body(new BodyValidationPipe()) payload: CreateAssetTypeDto,
    @Res() res: Response,
  ) {
    try {
      const newAssetType = await this.assetTypeService.create(payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { assetType: newAssetType },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(RouterUrl.ASSET_TYPE.UPDATE)
  async update(
    @Body(new BodyValidationPipe()) payload: UpdateAssetTypeDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { id } = req.params;

      const result = await this.assetTypeService.update(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { result },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(RouterUrl.ASSET_TYPE.DELETE)
  async delete(@Res() res: Response, @Req() req: Request) {
    try {
      const { id } = req.params;

      const result = await this.assetTypeService.delete(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { result },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.ASSET_TYPE.LIST)
  async list(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize, status } = req.body as GroupCashQuery;

      const where = [];

      if (status && status.trim().length > 0) {
        where.push({ status });
      }

      const data = await this.assetTypeService.listAndCount({
        where,
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
        order: {
          created_at: 'ASC',
        },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { list_asset_type: data[0], total: data[1] },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(RouterUrl.ASSET_TYPE.RETRIEVE)
  async getById(@Res() res: Response, @Req() req: Request) {
    try {
      const { id } = req.params;

      const assetType = await this.assetTypeService.retrieveOne({
        where: { id },
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { assetType },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
