import { Injectable } from '@nestjs/common';
import { NewBaseService } from 'src/common/service/new-base.service';
import { FindOneOptions, FindOptionsWhere, ILike } from 'typeorm';
import { CreateStoreDto } from './dto/create-store.dto';
import { ListStoreQueryDto } from './dto/list-store-query.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './store.entity';
import { StoreRepository } from './store.repository';

@Injectable()
export class StoreService extends NewBaseService<
  Store,
  CreateStoreDto,
  UpdateStoreDto,
  ListStoreQueryDto,
  StoreResponseDto,
  StoreRepository
> {
  constructor(private storeRepository: StoreRepository) {
    super(storeRepository, 'store', 'store');
  }

  async listByQuery(
    query: ListStoreQueryDto,
  ): Promise<{ results: Store[]; total: number }> {
    const { search, status, page, pageSize } = query;

    const where: FindOptionsWhere<Store>[] = [];

    if (search) {
      where.push({ name: ILike(search) });
    }

    if (status) {
      where.push({ status });
    }

    const roleResponseData = await this.repository.findAndCount({
      where,
      skip: page,
      take: pageSize,
      relations: this.repository.getRelations(),
    });

    const results = roleResponseData[0].map((record) =>
      this.repository.mapResponse(record),
    );

    return { results, total: roleResponseData[1] };
  }

  async retrieveMapResponse(options: FindOneOptions<Store>): Promise<Store> {
    const store = await this.repository.findOrThrowError(
      {
        message: this.repository.i18n.getMessage('errors.common.not_found', {
          entity: this.repository.i18n.getMessage('args.entity.store'),
        }),
      },
      { ...options, relations: this.repository.getRelations() },
    );

    return this.repository.mapResponse(store);
  }
}
