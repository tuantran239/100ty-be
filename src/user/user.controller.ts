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
import { ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import RouterUrl from 'src/common/constant/router';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ResponseData, RoleId, RoleName } from 'src/common/interface';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { mapUserResponse } from 'src/common/utils/map';
import { RoleService } from 'src/role/role.service';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserQuery } from 'src/common/interface/query';
import { InitRoleData } from 'src/common/constant/data';
import { IsNull } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { getSearch } from 'src/common/utils/query';

@ApiTags('User')
@Controller(RouterUrl.USER.ROOT)
export class UserController {
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private readonly i18n: I18nService,
  ) {}

  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(RouterUrl.USER.CREATE)
  async createUser(
    @Body(new BodyValidationPipe()) payload: RegisterDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const meId = req?.user?.user_id ?? '';
      const me = req?.user as User;

      const { username, password, role_id } = payload;

      await this.roleService.checkLevelRole(me?.roles[0]?.id, role_id, true);

      const userUsername = await this.userService.retrieveOne({
        where: { username },
      });

      if (userUsername) {
        throw new BadRequestException(
          this.i18n.t('errors.auth.username_exists', {
            lang: I18nContext.current().lang,
          }),
        );
      }

      const salt = await bcrypt.genSalt();

      const hashPassword = await bcrypt.hash(password, salt);

      payload.password = hashPassword;

      const newUser = await this.userService.create({
        ...payload,
        managerId: meId,
      });

      if (role_id) {
        await this.roleService.createUserRole({ role_id, user_id: newUser.id });
      } else {
        const role = await this.roleService.retrieveOne({
          where: { name: RoleName.USER },
        });
        if (role) {
          await this.roleService.createUserRole({
            role_id: role.id,
            user_id: newUser.id,
          });
        }
      }

      const responseData: ResponseData = {
        message: 'success',
        data: { user: newUser },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(RouterUrl.USER.RETRIEVE)
  async retrieveUser(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const me = req?.user as User;

      const userRole = me?.roles[0];

      if (userRole.id === RoleId.ADMIN) {
        const user = await this.userService.retrieveOne({
          where: { id, managerId: me.id },
        });

        if (!user) {
          throw new Error(`Nhân viên không thuộc quản lí của admin`);
        }
      }

      const user = await this.userService.retrieveOne({
        where: { id: req.params.id },
        relations: ['roles'],
      });

      const roleData = InitRoleData.find((role) => role.name == userRole.name);

      const permissionData = await fetch(roleData.link, { method: 'GET' });

      const permissions = await permissionData.json();

      const responseData: ResponseData = {
        message: 'success',
        data: mapUserResponse(user, user?.roles ?? [], permissions ?? null),
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.USER.LIST)
  async listUser(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize, search } = req.body as UserQuery;

      const me = req?.user as User;

      const searchType = parseInt((search as string) ?? '');

      const where = [];

      const query = {
        managerId: me?.roles[0]?.id == RoleId.ADMIN ? me?.id : undefined,
        deleted_at: IsNull(),
      };

      if (!Number.isNaN(searchType)) {
        where.push({ ...query, phoneNumber: getSearch(search, 'both') });
      } else if (search && search.trim().length > 0) {
        where.push({ ...query, username: getSearch(search, 'both') });
        where.push({ ...query, fullName: getSearch(search, 'both') });
      } else {
        where.push({ ...query });
      }

      const data = await this.userService.listAndCount({
        where,
        relations: ['roles'],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { list_user: data[0], total: data[1] },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Put(RouterUrl.USER.UPDATE)
  async updateUser(
    @Body(new BodyValidationPipe()) payload: UpdateUserDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const id = req.params.id;

      const me = req?.user as User;

      const userRole = me?.roles[0];

      if (userRole.id === RoleId.ADMIN) {
        const user = await this.userService.retrieveOne({
          where: { id, managerId: me.id },
        });

        if (!user) {
          throw new Error(`Nhân viên không thuộc quản lí của admin`);
        }
      }

      if (payload.username) {
        const userUsername = await this.userService.retrieveOne({
          where: { username: payload.username },
        });

        if (userUsername) {
          throw new BadRequestException(
            this.i18n.t('errors.auth.username_exists', {
              lang: I18nContext.current().lang,
            }),
          );
        }
      }

      if (payload.password) {
        const salt = await bcrypt.genSalt();

        const hashPassword = await bcrypt.hash(payload.password, salt);

        payload.password = hashPassword;
      }

      const result = await this.userService.update(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { user: result },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Delete(RouterUrl.USER.DELETE)
  async deleteUser(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const me = req?.user as User;

      const userRole = me?.roles[0];

      if (userRole.id === RoleId.ADMIN) {
        const user = await this.userService.retrieveOne({
          where: { id, managerId: me.id },
        });

        if (!user) {
          throw new Error(`Nhân viên không thuộc quản lí của admin`);
        }
      }

      const result = await this.userService.delete(id);

      const responseData: ResponseData = {
        message: 'success',
        data: { user: result },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
