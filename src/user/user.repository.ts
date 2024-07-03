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
import { FindOptionsWhere, Repository } from 'typeorm';
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
    super(repository, USER_RELATIONS, i18n, new User());
  }

  setCheckValid(payload: CreateUserDto | UpdateUserDto): CheckValid<User> {
    const phoneNumberUnique: CreateAndSaveCheckValid<User> = {
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
      field: 'phoneNumber',
      payload,
    };

    const usernameUnique: CreateAndSaveCheckValid<User> = {
      type: 'unique',
      message: this.i18n.getMessage('errors.common.existed', {
        field: this.i18n.getMessage('args.field.username'),
        entity: this.i18n.getMessage('args.entity.user'),
        value: payload.username,
      }),
      options: {
        where: {
          username: payload.username,
        },
      },
      field: 'username',
      payload,
    };

    const roleEnumType: CreateAndSaveCheckValid<User> = {
      type: 'enum_type',
      message: this.i18n.getMessage('errors.common.not_valid', {
        field: this.i18n.getMessage('args.field.role_id'),
      }),
      options: {
        enumType: RoleId,
        inputs: [payload.role_id],
      },
      field: 'roleId',
    };

    const userNotFound: CreateAndSaveCheckValid<User> = {
      type: 'not_found',
      message: this.i18n.getMessage('errors.common.not_found', {
        field: this.i18n.getMessage('args.field.id'),
        entity: this.i18n.getMessage('args.entity.store'),
        value: (payload as UpdateUserDto).id,
      }),
      options: {
        where: {
          id: (payload as UpdateUserDto).id,
        },
      },
      field: 'id',
      payload,
    };

    const createAndSave: CreateAndSaveCheckValid<User>[] = [
      phoneNumberUnique,
      usernameUnique,
    ];

    const updateAndSave: CreateAndSaveCheckValid<User>[] = [
      phoneNumberUnique,
      usernameUnique,
      userNotFound,
      roleEnumType,
    ];

    if (payload.role_id) {
      createAndSave.push(roleEnumType);
    }

    return { createAndSave, updateAndSave };
  }

  setQueryDefault(
    payload?: Record<string, any> | CreateUserDto | UpdateUserDto,
  ): FindOptionsWhere<User> {
    return {
      workspaceId: payload.workspaceId,
    };
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
      (payload as any).roleId = payload.role_id ?? RoleId.USER;
      payload.password = await hashPassword(payload.password);
      return payload as any;
    } else if (type === 'update') {
      return payload;
    }
  }
}
