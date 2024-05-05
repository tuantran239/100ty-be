import {
  Controller,
  Get,
  InternalServerErrorException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import RouterUrl from 'src/common/constant/router';
import { ResponseData } from 'src/common/interface';
import { RoleService } from './role.service';

@Controller(RouterUrl.ROLE.ROOT)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.ROLE.LIST)
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
}
