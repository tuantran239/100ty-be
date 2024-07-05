import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import IConfig, { JWTConfig } from 'src/common/config/config.interface';
import { UserService } from 'src/user/user.service';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { ActiveStatus } from 'src/common/types/status';

import 'dotenv/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<IConfig>,
    private userService: UserService,
    private workspaceService: WorkspaceService,
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
      throw new NotFoundException(
        this.userService.repository.i18n.getMessage('errors.common.not_found', {
          entity:
            this.userService.repository.i18n.getMessage('args.entity.user'),
        }),
      );
    }

    const workspace = await this.workspaceService.repository.findOne({
      where: { id: user.workspaceId ?? '' },
    });

    if (!workspace) {
      throw new NotFoundException(
        this.userService.repository.i18n.getMessage('errors.common.not_found', {
          entity: this.userService.repository.i18n.getMessage(
            'args.entity.workspace',
          ),
        }),
      );
    }

    if (workspace.status === ActiveStatus.OFF) {
      throw new NotFoundException(
        this.userService.repository.i18n.getMessage(
          'errors.common.status_off',
          {
            entity: this.userService.repository.i18n.getMessage(
              'args.entity.workspace',
            ),
          },
        ),
      );
    }

    const userResponse = this.userService.repository.mapResponse(user);

    return { user_id: user.id, ...userResponse };
  }
}
