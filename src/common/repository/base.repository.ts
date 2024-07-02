import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { SoftDeletableEntity } from '../entity/soft-deletable.entity';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { checkEnumTypeValid } from '../utils/validate';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { User } from 'src/user/user.entity';
import { RoleId } from 'src/role/role.type';

export interface CreateAndSaveCheckValid<E> {
  type: 'unique' | 'enum_type';
  message: string;
  options:
    | FindOneOptions<E>
    | { enumType: Record<string, string>; inputs: string[] };
}

export interface CheckValid<E> {
  createAndSave?: Array<CreateAndSaveCheckValid<E>>;
  updateAndSave?: Array<CreateAndSaveCheckValid<E>>;
}

export interface MapPayload<C, U> {
  type: 'create' | 'update';
  payload: C | U;
}

@Injectable()
export abstract class BaseRepository<
  E extends SoftDeletableEntity | Record<string, any>,
  C,
  U,
  R,
> extends Repository<E> {
  constructor(
    protected repository: Repository<E>,
    private relations: string[],
    public i18n: I18nCustomService,
    public entity: E
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async createAndSave(
    payload: C,
    checkValid?: Array<CreateAndSaveCheckValid<E>>,
  ): Promise<E> {
    const createSaveCheckValid =
      checkValid ?? this.setCheckValid(payload).createAndSave;

    await this.checkValidMethod(createSaveCheckValid);

    const mapPayload = await this.mapPayload({ type: 'create', payload });

    const newRecord = await this.create(mapPayload);

    return (await this.save(newRecord)) as any;
  }

  async updateAndSave(payload: U & { id: string }): Promise<E> {
    const { id } = payload;

    const record = await this.findOrThrowError(
      {
        message: this.i18n.getMessage('errors.common.not_found', {
          entity: 'args.entity.user',
        }),
        checkExist: false,
      },
      { where: { id } } as any,
    );

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const recordValue = record[key];

      if (recordValue !== undefined && recordValue !== payloadValue) {
        record[key] = payloadValue;
      }
    }

    await this.save(record);

    return record;
  }

  async deleteSoft(options: FindOneOptions<E>): Promise<E> {
    const record = await this.findOrThrowError(
      {
        message: this.i18n.getMessage('errors.common.not_found', {
          entity: 'args.entity.user',
        }),
        checkExist: false,
      },
      options,
    );

    record.deleted_at = new Date();

    await this.save(record);

    return record;
  }

  async deleteData(options: FindOneOptions<E>): Promise<E> {
    const record = await this.findOrThrowError(
      {
        message: this.i18n.getMessage('errors.common.not_found', {
          entity: 'args.entity.user',
        }),
        checkExist: false,
      },
      options,
    );

    await this.delete({ id: record.id } as any);

    return record;
  }

  getRelations(): string[] {
    return this.relations;
  }

  async findOrThrowError(
    data: {
      message?: string;
      checkExist?: boolean;
    },
    options?: FindOneOptions<E>,
  ): Promise<E> {
    const { message, checkExist } = data;

    const record = await this.findOne(options);

    if (record && checkExist) {
      throw new BadRequestException(message ?? 'Record exist');
    } else if (!record && !checkExist) {
      throw new NotFoundException(message ?? 'Record not found');
    }

    return record;
  }

  async checkValidMethod(validArr?: Array<CreateAndSaveCheckValid<E>>) {
    if (validArr) {
      for (let i = 0; i < validArr.length; i++) {
        const valid = validArr[i];

        if (valid.type === 'unique') {
          await this.findOrThrowError(
            {
              message: valid.message,
              checkExist: true,
            },
            valid.options as FindOneOptions<E>,
          );
        }
        if (valid.type === 'enum_type') {
          const optionsValid = valid.options as {
            enumType: Record<string, string>;
            inputs: string[];
          };
          checkEnumTypeValid(
            optionsValid.enumType,
            optionsValid.inputs,
            valid.message,
          );
        }
      }
    }
  }

  async checkValidWithAction(action: 'create' | 'update', payload: C | U) {
    if (action === 'create') {
      await this.checkValidMethod(this.setCheckValid(payload).createAndSave);
    } else if (action === 'update') {
      await this.checkValidMethod(this.setCheckValid(payload).updateAndSave);
    }
  }

  filterRole(me: UserResponseDto | any) {
    const role = me.role;

    let user: FindOptionsWhere<User>[] | undefined = undefined;

    if (role.id === RoleId.ADMIN) {
      user = [{ id: me.id }, { managerId: me.id }];
    } else if (role.id === RoleId.USER) {
      user = [{ id: me.id }];
    }

    return user;
  }

  abstract mapResponse(payload: E): R;

  abstract mapPayload(data: MapPayload<C, U>): Promise<any>;

  abstract setCheckValid(payload: C | U): CheckValid<E>;
}
