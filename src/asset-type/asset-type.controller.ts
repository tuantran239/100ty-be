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
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { GroupCashQuery } from 'src/common/types/query';
import { RoleId } from 'src/role/role.type';
import { AssetTypeRouter } from './asset-type.router';
import { AssetTypeService } from './asset-type.service';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { AssetType } from './entities/asset-type.entity';

@Controller(AssetTypeRouter.ROOT)
export class AssetTypeController {
  constructor(private assetTypeService: AssetTypeService) {}

  @CheckRoles({
    id: RoleId.SUPER_ADMIN,
    entity: new AssetType(),
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(AssetTypeRouter.CREATE)
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

  @CheckRoles({
    id: RoleId.SUPER_ADMIN,
    entity: new AssetType(),
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(AssetTypeRouter.UPDATE)
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

  @CheckRoles({
    id: RoleId.SUPER_ADMIN,
    entity: new AssetType(),
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(AssetTypeRouter.DELETE)
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new AssetType(),
    },
    {
      id: RoleId.ADMIN,
      entity: new AssetType(),
    },
    {
      id: RoleId.USER,
      entity: new AssetType(),
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(AssetTypeRouter.LIST)
  async list(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize, status } = req.body as GroupCashQuery;

      const where = [];

      if (status && status.trim().length > 0) {
        where.push({ status });
      }

      const data = await this.assetTypeService.listAndCount({
        where,
        relations: ['properties'],
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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new AssetType(),
    },
    {
      id: RoleId.ADMIN,
      entity: new AssetType(),
    },
    {
      id: RoleId.USER,
      entity: new AssetType(),
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(AssetTypeRouter.RETRIEVE)
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
