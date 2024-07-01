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
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { RoleName } from 'src/role/role.type';
import { CreateWareHouseDto } from './dto/create-warehouse.dto';
import { ListWarehouseQueryDto } from './dto/list-warehouse-query.dto';
import { UpdateWareHouseDto } from './dto/update-warehouse.dto';
import { WarehouseRouter } from './warehouse.router';
import { WarehouseService } from './warehouse.service';

@Controller(WarehouseRouter.ROOT)
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(WarehouseRouter.CREATE)
  async create(
    @Body(new BodyValidationPipe()) payload: CreateWareHouseDto,
    @Res() res: Response,
  ) {
    try {
      const newWarehouse = await this.warehouseService.create(payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { warehouse: newWarehouse },
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
  @Put(WarehouseRouter.UPDATE)
  async update(
    @Body(new BodyValidationPipe()) payload: UpdateWareHouseDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { id } = req.params;

      const result = await this.warehouseService.update(id, payload);

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
  @Post(WarehouseRouter.LIST)
  async list(
    @Body(new BodyValidationPipe()) query: ListWarehouseQueryDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.warehouseService.listWarehouse(query);

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
