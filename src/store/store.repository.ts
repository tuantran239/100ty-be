import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseRepository,
  CheckValid,
  CreateAndSaveCheckValid,
  MapPayload,
} from 'src/common/repository/base.repository';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { Repository } from 'typeorm';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './store.entity';
import { ActiveStatus } from 'src/common/types/status';

const STORE_RELATIONS = [];

export class StoreRepository extends BaseRepository<
  Store,
  CreateStoreDto,
  UpdateStoreDto,
  StoreResponseDto
> {
  constructor(
    @InjectRepository(Store)
    protected repository: Repository<Store>,
    public i18n: I18nCustomService,
  ) {
    super(repository, STORE_RELATIONS, i18n, new Store());
  }

  setCheckValid(payload: CreateStoreDto | UpdateStoreDto): CheckValid<Store> {
    const codeUnique: CreateAndSaveCheckValid<Store> = {
      type: 'unique',
      message: this.i18n.getMessage('errors.common.existed', {
        field: this.i18n.getMessage('args.field.code'),
        entity: this.i18n.getMessage('args.entity.store'),
        value: payload.code,
      }),
      options: {
        where: {
          code: payload.code,
        },
      },
      field: 'code',
    };

    const statusEnumType: CreateAndSaveCheckValid<Store> = {
      type: 'enum_type',
      message: this.i18n.getMessage('errors.common.not_valid', {
        field: this.i18n.getMessage('args.field.status'),
      }),
      options: {
        enumType: ActiveStatus,
        inputs: [payload.status],
      },
      field: 'status',
    };

    const storeNotFound: CreateAndSaveCheckValid<Store> = {
      type: 'not_found',
      message: this.i18n.getMessage('errors.common.not_found', {
        field: this.i18n.getMessage('args.field.id'),
        entity: this.i18n.getMessage('args.entity.store'),
        value: (payload as UpdateStoreDto).id,
      }),
      options: {
        where: {
          id: (payload as UpdateStoreDto).id,
        },
      },
      field: 'id',
    };

    const createAndSave: CreateAndSaveCheckValid<Store>[] = [codeUnique];

    const updateAndSave: CreateAndSaveCheckValid<Store>[] = [
      storeNotFound,
      codeUnique,
      statusEnumType,
    ];

    if (payload.status) {
      createAndSave.push(statusEnumType);
    }

    return { createAndSave, updateAndSave };
  }

  mapResponse(payload: Store): StoreResponseDto {
    return payload;
  }

  async mapPayload(
    data: MapPayload<CreateStoreDto, UpdateStoreDto>,
  ): Promise<any> {
    const { type, payload } = data;

    if (type === 'create') {
      return payload as any;
    } else if (type === 'update') {
      return payload;
    }
  }
}
