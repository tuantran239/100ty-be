import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';

import { I18nContext, I18nService } from 'nestjs-i18n';
import { RoleService } from 'src/role/role.service';
import { RegisterDto } from './dto/register.dto';
import { RoleName } from 'src/role/role.type';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly i18n: I18nService,
    private roleService: RoleService,
  ) {}

  async hashPassword() {}

  async login(payload: LoginDto): Promise<User> {
    const { username, password } = payload;

    let user: User | undefined = undefined;

    user = await this.userService.retrieveOne({
      where: [{ username: username }, { username }],
      relations: ['roles'],
    });

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> query user >>>>>>>>>>>>>>>');
    console.log(user);

    if (!user) {
      throw new BadRequestException(
        this.i18n.t('errors.auth.username_email_not_match', {
          lang: I18nContext.current().lang,
        }),
      );
    }

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> user exist >>>>>>>>>>>>>>>');

    const isMatchPassword = await bcrypt.compare(password, user.password);

    if (!isMatchPassword) {
      throw new BadRequestException(
        this.i18n.t('errors.auth.password_not_match', {
          lang: I18nContext.current().lang,
        }),
      );
    }

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> password match >>>>>>>>>>>>>>>');

    return user;
  }

  async register(payload: RegisterDto): Promise<User> {
    const { username, password, role_id } = payload;

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

    const newUser = await this.userService.create(payload);

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

    return newUser;
  }
}
