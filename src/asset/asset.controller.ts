import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {  Response } from 'express';
import { RequestCustom } from 'src/common/types/http';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { RoleId, RoleName } from 'src/role/role.type';
import { AssetRouter } from './asset.router';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ListAssetQueryDto } from './dto/list-asset-query.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Asset } from './asset.entity';

@Controller(AssetRouter.ROOT)
export class AssetController {
  constructor(private assetService: AssetService) {}

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new Asset(),
    },
    {
      id: RoleId.ADMIN,
      entity: new Asset(),
    },
    {
      id: RoleId.USER,
      entity: new Asset(),
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(AssetRouter.CREATE)
  async create(
    @Body(new BodyValidationPipe()) payload: CreateAssetDto,
    @Res() res: Response,
  ) {
    try {
      const newAsset = await this.assetService.create(payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { asset: newAsset },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new Asset(),
    },
    {
      id: RoleId.ADMIN,
      entity: new Asset(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Asset(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(AssetRouter.UPDATE)
  async update(
    @Body(new BodyValidationPipe()) payload: UpdateAssetDto,
    @Res() res: Response,
    @Req() req: RequestCustom,
  ) {
    try {
      const { id } = req.params;

      const result = await this.assetService.update(id, payload);

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
      entity: new Asset(),
    },
    {
      id: RoleId.ADMIN,
      entity: new Asset(),
      conditions: {
        createdBy: true
      }
    },
    {
      id: RoleId.USER,
      entity: new Asset(),
      conditions: {
        createdBy: true
      }
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(AssetRouter.LIST)
  async list(
    @Body(new BodyValidationPipe()) query: ListAssetQueryDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.assetService.listAsset(query);

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
}
