/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import IConfig, { JWTConfig } from 'src/common/config/config.interface';
import { LogActionType } from 'src/common/constant/log';
import RouterUrl from 'src/common/constant/router';
import { ResponseData } from 'src/common/interface';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { mapUserResponse } from 'src/common/utils/map';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { RoleService } from 'src/role/role.service';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CacheService } from 'src/cache/cache.service';
import { User } from 'src/user/user.entity';

@ApiTags('Auth')
@Controller(RouterUrl.AUTH.ROOT)
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService<IConfig>,
    private userService: UserService,
    private roleService: RoleService,
    private logger: LoggerServerService,
    private logActionService: LogActionService,
    private cacheService: CacheService,
  ) {}

  @Post(RouterUrl.AUTH.LOGIN)
  async login(
    @Body(new BodyValidationPipe()) payload: LoginDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      this.logger.log(
        { customerMessage: 'Login', serverType: 'request' },
        payload,
      );

      const user = await this.authService.login(payload);

      this.logger.log(
        { customerMessage: 'Login', serverType: 'request' },
        { msg: `Retrieved user: ${JSON.stringify(user)}` },
      );

      if (!user) {
        throw new BadRequestException('Không tìm thấy người dùng');
      }

      const token = await this.jwtService.sign(
        { userId: user.id, username: user.username },
        {
          secret:
            this.configService.get<JWTConfig>('jwtConfig').secret ?? 'secret',
        },
      );
      this.logger.log(
        { customerMessage: 'Login', serverType: 'request' },
        { msg: `Gen token: ${JSON.stringify(token)}` },
      );

      this.logger.log(
        { customerMessage: 'Login', serverType: 'response' },
        { token },
      );

      this.logActionService.create({
        userId: user.id,
        action: LogActionType.LOGIN,
        agent: { agent: req.get('user-agent') },
        data: { token },
      });

      const responseData: ResponseData = {
        error: null,
        data: {
          token,
          ...mapUserResponse(
            user,
            user?.roles ?? [],
            user.roles[0]?.permissions ?? null,
          ),
        },
        message: 'success',
        statusCode: 200,
      };

      return res.status(201).send(responseData);
    } catch (error) {
      this.logger.error(
        { customerMessage: 'Login', serverType: 'request' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post(RouterUrl.AUTH.REGISTER)
  async register(
    @Body(new BodyValidationPipe()) payload: RegisterDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        { customerMessage: 'Signup', serverType: 'request' },
        payload,
      );
      const user = await this.authService.register(payload);

      const token = await this.jwtService.sign(
        { userId: user.id, username: user.username },
        {
          secret:
            this.configService.get<JWTConfig>('jwtConfig').secret ?? 'secret',
        },
      );

      const responseData: ResponseData = {
        error: null,
        data: { token },
        message: 'success',
        statusCode: 201,
      };

      return res.status(201).send(responseData);
    } catch (error) {
      this.logger.error(
        { customerMessage: 'Signup', serverType: 'request' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.AUTH.ME)
  async me(@Res() res: Response, @Req() req) {
    try {
      const user = await this.userService.retrieveOne({
        where: { id: req?.user?.user_id },
        relations: ['roles'],
      });

      if (!user) {
        throw new BadRequestException('Không tìm thấy người dùng');
      }

      const responseData: ResponseData = {
        error: null,
        data: mapUserResponse(
          user,
          user?.roles ?? [],
          user.roles[0]?.permissions ?? null,
        ),
        message: 'success',
        statusCode: 200,
      };

      return res.status(201).send(responseData);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.AUTH.LOGOUT)
  async logout(@Res() res: Response, @Req() req) {
    try {
      const me = req.user as User;

      await this.cacheService.removeUser(me?.username ?? '');

      const responseData: ResponseData = {
        error: null,
        data: req.user,
        message: 'success',
        statusCode: 200,
      };

      return res.status(201).send(responseData);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
