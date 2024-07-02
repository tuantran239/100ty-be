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
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { Equal, FindOptionsWhere } from 'typeorm';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RoleRouter } from './role.router';
import { RoleService } from './role.service';
import { RoleId } from './role.type';

@Controller(RoleRouter.ROOT)
export class RoleController {
  constructor(
    private roleService: RoleService,
    private cacheService: CacheService,
  ) {}

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    },
    {
      id: RoleId.ADMIN
    }
  )
  @UseGuards(JwtAuthGuard)
  @Get(RoleRouter.LIST)
  async listCustomer(@Res() res: Response, @Req() req: Request) {
    try {

      const me = req.user as UserResponseDto;

      const where: FindOptionsWhere<Role>[] = [];

      if(me.role.id === RoleId.ADMIN) {
        where.push({ id: Equal(RoleId.USER) })
      }

      const roles = await this.roleService.list({ where });

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

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
    }
  )
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
