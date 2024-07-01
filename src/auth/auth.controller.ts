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
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { ResponseData } from 'src/common/types';
import { DatabaseService } from 'src/database/database.service';
import { LogActionService } from 'src/log-action/log-action.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { UserService } from 'src/user/user.service';
import { AuthRouter } from './auth.router';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller(AuthRouter.ROOT)
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService<IConfig>,
    private userService: UserService,
    private logger: LoggerServerService,
    private logActionService: LogActionService,
    private databaseService: DatabaseService,
  ) {}

  @Post(AuthRouter.LOGIN)
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
          user: this.databaseService
            .getRepositories()
            .userRepository.mapResponse(user),
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

  @Post(AuthRouter.REGISTER)
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
  @Get(AuthRouter.ME)
  async me(@Res() res: Response, @Req() req) {
    try {
      const user = await this.userService.retrieveOne({
        where: { id: req?.user?.user_id },
        relations: ['role'],
      });

      if (!user) {
        throw new BadRequestException('Không tìm thấy người dùng');
      }

      const responseData: ResponseData = {
        error: null,
        data: {
          user: this.databaseService
            .getRepositories()
            .userRepository.mapResponse(user),
        },
        message: 'success',
        statusCode: 200,
      };

      return res.status(201).send(responseData);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(AuthRouter.LOGOUT)
  async logout(@Res() res: Response, @Req() req) {
    try {
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
