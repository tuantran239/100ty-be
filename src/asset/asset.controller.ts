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
import RouterUrl from 'src/common/constant/router';
import { AssetService } from './asset.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ResponseData, RoleName } from 'src/common/interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { CreateAssetDto } from './dto/create-asset.dto';
import { Request, Response } from 'express';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ListAssetQueryDto } from './dto/list-asset-query.dto';

@Controller(RouterUrl.ASSET.ROOT)
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.ASSET.CREATE)
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

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(RouterUrl.ASSET.UPDATE)
  async update(
    @Body(new BodyValidationPipe()) payload: UpdateAssetDto,
    @Res() res: Response,
    @Req() req: Request,
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

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.ASSET.LIST)
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
