import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import IConfig, { JWTConfig } from 'src/common/config/config.interface';

import 'dotenv/config';
import { UserService } from 'src/user/user.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<IConfig>,
    private userService: UserService,
    private cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<JWTConfig>('jwtConfig').secret ?? 'secret',
    });
  }

  async validate(payload: any) {
    const user = await this.cacheService.getUser(payload.username);

    if (!user) {
      throw new Error(`Người dùng không tồn tại.`);
    }

    return { user_id: user.id, ...user };
  }
}
