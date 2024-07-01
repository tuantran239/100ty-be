import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseRepository,
  CheckValid,
  CreateAndSaveCheckValid,
  MapPayload,
} from 'src/common/repository/base.repository';
import { hashPassword } from 'src/common/utils/hash';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { RoleId } from 'src/role/role.type';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './user.entity';

const USER_RELATIONS = ['role'];

export class UserRepository extends BaseRepository<
  User,
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto
> {
  constructor(
    @InjectRepository(User)
    protected repository: Repository<User>,
    public i18n: I18nCustomService,
  ) {
    super(repository, USER_RELATIONS, i18n);
  }

  setCheckValid(payload: CreateUserDto | UpdateUserDto): CheckValid<User> {
    const createAndSave: CreateAndSaveCheckValid<User>[] = [
      {
        type: 'unique',
        message: this.i18n.getMessage('errors.common.existed', {
          field: this.i18n.getMessage('args.field.phone_number'),
          entity: this.i18n.getMessage('args.entity.user'),
          value: payload.phoneNumber,
        }),
        options: {
          where: {
            phoneNumber: payload.phoneNumber,
          },
        },
      },
    ];

    if (payload.roleId) {
      createAndSave.push({
        type: 'enum_type',
        message: this.i18n.getMessage('errors.common.not_valid', {
          field: this.i18n.getMessage('args.field.role_id'),
        }),
        options: {
          enumType: RoleId,
          inputs: [payload.roleId],
        },
      });
    }

    return { createAndSave };
  }

  mapResponse(payload: User): UserResponseDto {
    const role = payload.role;

    let permissions = [];

    if (role) {
      permissions = role?.permissions ?? [];

      role.permissions = undefined;
    }

    const userData = {
      ...payload,
      role,
      password: undefined,
      permissions,
    };

    return {
      ...userData,
    } as UserResponseDto;
  }

  async mapPayload(
    data: MapPayload<CreateUserDto, UpdateUserDto>,
  ): Promise<any> {
    const { type, payload } = data;

    if (type === 'create') {
      payload.roleId = payload.roleId ?? RoleId.USER;
      payload.password = await hashPassword(payload.password);
      return payload;
    } else if (type === 'update') {
      return payload;
    }
  }
}
