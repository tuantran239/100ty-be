import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CacheService } from 'src/cache/cache.service';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleRouter } from './role.router';
import { RoleService } from './role.service';

@Controller(RoleRouter.ROOT)
export class RoleController {
  constructor(
    private roleService: RoleService,
    private cacheService: CacheService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(RoleRouter.LIST)
  async listCustomer(@Res() res: Response) {
    try {
      const roles = await this.roleService.list({});

      const responseData: ResponseData = {
        message: 'success',
        data: { roles },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(RoleRouter.UPDATE)
  async updateRole(
    @Body(new BodyValidationPipe()) payload: UpdateRoleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const id = req.params.id;

      const roles = await this.roleService.update(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { roles },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
