import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import * as bcrypt from 'bcrypt';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly i18n: I18nCustomService
  ) {}

  async login(payload: LoginDto): Promise<User> {
    const { username, password } = payload;

    let user: User | undefined = undefined;

    user = await this.userService.retrieveOne({
      where: [{ username }],
      relations: ['role'],
    });

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> query user >>>>>>>>>>>>>>>');
    console.log(user);

    if (!user) {
      throw new BadRequestException(
        this.i18n.getMessage('errors.common.not_found', {
          entity: this.i18n.getMessage('args.entity.user'),
        }),
      );
    }

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> user exist >>>>>>>>>>>>>>>');

    const isMatchPassword = await bcrypt.compare(password, user.password);

    if (!isMatchPassword) {
      throw new BadRequestException(
        this.i18n.getMessage('errors.common.not_match', {
          entity: this.i18n.getMessage('args.entity.user'),
        }),
      );
    }

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> password match >>>>>>>>>>>>>>>');

    return user;
  }

  async register(payload: RegisterDto): Promise<User> {
    const newUser = await this.userService.create(payload);

    return newUser;
  }
}
