import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { RoleId } from 'src/role/role.type';
import {
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseCreateDto } from '../dto/base-create.dto';
import { BaseStoreUpdateDto } from '../dto/base-store-update.dto';
import { BaseUpdateDto } from '../dto/base-update.dto';
import { BaseStoreEntity } from '../entity/base-store.entity';
import { BaseWorkspaceEntity } from '../entity/base-workspace.entity';
import { checkEnumTypeValid } from '../utils/validate';
import { DefaultQuery } from '../types/http';

export type CheckValidType = 'unique' | 'enum_type' | 'not_found' | 'status';

export interface CreateAndSaveCheckValid<E> {
  type: CheckValidType;
  message: string;
  options:
    | FindOneOptions<E>
    | { enumType: Record<string, string>; inputs: string[] };
  field: keyof E;
  payload?: Record<string, any>;
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
  E extends Record<string, any> | BaseWorkspaceEntity | BaseStoreEntity,
  C extends Record<string, any> | BaseCreateDto,
  U extends Record<string, any> | BaseUpdateDto,
  R,
> extends Repository<E> {
  // public checkValidValues: CreateAndSaveCheckValid<E>[] = [];

  constructor(
    protected repository: Repository<E>,
    private relations: string[],
    public i18n: I18nCustomService,
    public entityTarget: EntityTarget<E>,
    public entity: string,
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

  async updateAndSave(
    payload: U,
    checkValid?: Array<CreateAndSaveCheckValid<E>>,
  ): Promise<E> {
    const { id } = payload as any;

    const updateSaveCheckValid =
      checkValid ?? this.setCheckValid(payload).updateAndSave;

    if (updateSaveCheckValid) {
      const notFound = updateSaveCheckValid.find(
        (valid) => valid.type === 'not_found',
      );

      if (notFound) {
        await this.checkValidMethod([{ ...notFound }]);
      }
    }

    const record = await this.findOne({ where: { id } } as any);

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const recordValue = record[key];

      if (recordValue !== undefined && recordValue !== payloadValue) {
        if (updateSaveCheckValid) {
          const validField = updateSaveCheckValid.find(
            (valid) => valid.field === key,
          );
          if (validField) {
            await this.checkValidMethod([{ ...validField }]);
          }
        }

        record[key] = payloadValue;
      }
    }

    await this.save(record);

    return record;
  }

  async deleteSoft(options?: FindOneOptions<E>): Promise<E> {
    const entityStr = `args.entity.${this.entity}`;

    const record = await this.findOrThrowError(
      {
        message: this.i18n.getMessage('errors.common.not_found', {
          entity: entityStr,
        }),
        checkExist: false,
      },
      options,
    );

    record.deleted_at = new Date();

    await this.save(record);

    return record;
  }

  async deleteData(options?: FindOneOptions<E>): Promise<E> {
    const entityStr = `args.entity.${this.entity}`;

    const record = await this.findOrThrowError(
      {
        message: this.i18n.getMessage('errors.common.not_found', {
          entity: entityStr,
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

  filterQuery<E>(
    query: DefaultQuery,
    options?: {
      createdBy?: boolean;
    },
  ) {
    const { userId, workspaceId, storeId, me } = query;

    const role = me.role;

    let defaultQuery: any = { workspaceId };

    if (role.id === RoleId.ADMIN || role.id === RoleId.USER) {
      defaultQuery = { ...defaultQuery, storeId };
    }

    if (options) {
      if (options.createdBy && role.id === RoleId.USER) {
        defaultQuery = { ...defaultQuery, storeId, user: { id: userId } };
      }
    }

    return defaultQuery;
  }

  convertDefaultOptions(
    options: FindOneOptions<E> | FindManyOptions<E>,
    payloadQueryDefault?: FindOptionsWhere<E>,
    payload?: C | U | Record<string, any>,
  ): FindOneOptions<E> | FindManyOptions<E> {
    let where = options.where ?? [];

    let queryDefault: any =
      payloadQueryDefault ?? this.setQueryDefault(payload) ?? {};

    if (Array.isArray(where)) {
      if (where.length === 0) {
        where.push(queryDefault);
      }

      for (let i = 0; i < where.length; i++) {
        const whereQuery = where[i];
        where[i] = { ...whereQuery, ...queryDefault };
      }
    } else {
      where = { ...where, ...queryDefault };
    }

    return { ...options, where };
  }

  async checkValidMethod(validArr?: Array<CreateAndSaveCheckValid<E>>) {
    if (validArr) {
      for (let i = 0; i < validArr.length; i++) {
        const valid = validArr[i];

        if (valid.type === 'unique') {
          const optionsUnique = (await this.convertDefaultOptions(
            valid.options as FindOneOptions<E>,
            null,
            valid.payload,
          )) as FindOneOptions<E>;

          await this.findOrThrowError(
            {
              message: valid.message,
              checkExist: true,
            },
            optionsUnique,
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

        if (valid.type === 'not_found') {
          const optionsNotFound = this.convertDefaultOptions(
            valid.options as FindOneOptions<E>,
            null,
            valid.payload,
          ) as FindOneOptions<E>;

          await this.findOrThrowError(
            {
              message: valid.message,
              checkExist: false,
            },
            optionsNotFound,
          );
        }

        if (valid.type === 'status') {
          await this.findOrThrowError(
            {
              message: valid.message,
              checkExist: true,
            },
            { ...valid.options } as FindOneOptions<E>,
          );
        }
      }
    }
  }

  async checkValidWithAction(
    action: 'create' | 'update',
    payload: C | U | Record<string, any>,
  ) {
    if (action === 'create') {
      await this.checkValidMethod(this.setCheckValid(payload).createAndSave);
    } else if (action === 'update') {
      await this.checkValidMethod(this.setCheckValid(payload).updateAndSave);
    }
  }

  async findAndCheckValid(payload: {
    type: CheckValidType;
    field: keyof E;
    data: Record<string, any>;
  }) {
    const checkValid = this.setCheckValid(payload.data);

    const checkValidValues: CreateAndSaveCheckValid<E>[] = Object.keys(
      checkValid,
    ).reduce((values, key) => {
      const value = checkValid[key];
      values = [...values, ...value];
      return values;
    }, []);

    const checkValidValue = checkValidValues.find(
      (value) => value.type === payload.type && value.field === payload.field,
    );

    if (checkValidValue) {
      await this.checkValidMethod([{ ...checkValidValue }]);
    } else {
      throw new NotFoundException(
        this.i18n.getMessage('errors.common.not_found', {
          entity: this.i18n.getMessage('args.entity.data'),
        }),
      );
    }

    return (await this.repository.findOne(
      checkValidValue.options as FindOneOptions,
    )) as E;
  }

  abstract mapResponse(payload: E): R;

  abstract mapPayload(data: MapPayload<C, U>): Promise<any>;

  abstract setCheckValid(payload: C | U | Record<string, any>): CheckValid<E>;

  abstract setQueryDefault(
    payload?: C | U | Record<string, any>,
  ): FindOptionsWhere<E> | undefined;
}
