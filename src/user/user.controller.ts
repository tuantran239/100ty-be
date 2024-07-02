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
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { UserQuery } from 'src/common/types/query';
import { getSearch } from 'src/common/utils/query';
import { RoleId } from 'src/role/role.type';
import { IsNull } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { UserRouter } from './user.router';
import { UserService } from './user.service';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('User')
@Controller(UserRouter.ROOT)
export class UserController {
  constructor(
    private userService: UserService,
    private readonly i18n: I18nService,
    @InjectRepository(User) private readonly userRepository: UserRepository,
  ) {}

  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new User(),
    },
    {
      id: RoleId.ADMIN,
      entity: new User(),
      conditions: {
        levelRole: true,
      },
    },
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(UserRouter.CREATE)
  async createUser(
    @Body(new BodyValidationPipe()) payload: RegisterDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const me = req?.user as User;

      const newUser = await this.userService.create({
        ...payload,
        managerId: me.id,
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { user: this.userService.repository.mapResponse(newUser) },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new User(),
    },
    {
      id: RoleId.ADMIN,
      entity: new User(),
      conditions: {
        levelRole: true,
        createdBy: true
      },
    },
  )
  @Get(UserRouter.RETRIEVE)
  async retrieveUser(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const user = await this.userService.retrieveOne({
        where: { id },
        relations: ['role'],
      });

      const responseData: ResponseData = {
        message: 'success',
        data: this.userRepository.mapResponse(user),
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new User(),
    },
    {
      id: RoleId.ADMIN,
      entity: new User(),
      conditions: {
        levelRole: true,
        createdBy: true
      },
    },
  )
  @Post(UserRouter.LIST)
  async listUser(@Res() res: Response, @Req() req: Request) {
    try {
      const { page, pageSize, search } = req.body as UserQuery;

      const me = req?.user as UserResponseDto

      const searchType = parseInt((search as string) ?? '');

      const where = [];

      const query = {
        managerId: me?.role?.id == RoleId.ADMIN ? me?.id : undefined,
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
        relations: ['role'],
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
  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new User(),
    },
    {
      id: RoleId.ADMIN,
      entity: new User(),
      conditions: {
        levelRole: true,
        createdBy: true
      },
    },
  )
  @Put(UserRouter.UPDATE)
  async updateUser(
    @Body(new BodyValidationPipe()) payload: UpdateUserDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const id = req.params.id;

      const me = req?.user as User;

      const userRole = me?.role;

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
  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: new User(),
    },
    {
      id: RoleId.ADMIN,
      entity: new User(),
      conditions: {
        levelRole: true,
        createdBy: true
      },
    },
  )
  @Delete(UserRouter.DELETE)
  async deleteUser(@Res() res: Response, @Req() req: Request) {
    try {
      const id = req.params.id;

      const me = req?.user as User;

      const userRole = me?.role;

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
