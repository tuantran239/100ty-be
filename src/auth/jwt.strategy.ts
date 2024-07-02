import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import IConfig, { JWTConfig } from 'src/common/config/config.interface';
import { UserService } from 'src/user/user.service';

import 'dotenv/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<IConfig>,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<JWTConfig>('jwtConfig').secret ?? 'secret',
    });
  }

  async validate(payload: any) {
    const user = await this.userService.retrieveOne({
      where: { id: payload.userId },
      relations: ['role'],
    });

    if (!user) {
      throw new InternalServerErrorException(
        this.userService.repository.i18n.getMessage('errors.common.not_found', {
          entity:
            this.userService.repository.i18n.getMessage('args.entity.user'),
        }),
      );
    }

    const userResponse = this.userService.repository.mapResponse(user);

    return { user_id: user.id, ...userResponse };
  }
}
