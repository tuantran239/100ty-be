import { Controller } from '@nestjs/common';
import { StoreRouter } from './store.router';
import { Store } from './store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ListStoreQueryDto } from './dto/list-store-query.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { StoreRepository } from './store.repository';
import { StoreService } from './store.service';
import { DataSource } from 'typeorm';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { BaseAuthController } from 'src/common/controller/base-auth.controller';
import { RoleId } from 'src/role/role.type';
import { DatabaseService } from 'src/database/database.service';

@Controller(StoreRouter.ROOT)
export class StoreController extends BaseAuthController<
  Store,
  CreateStoreDto,
  UpdateStoreDto,
  ListStoreQueryDto,
  StoreResponseDto,
  StoreRepository,
  StoreService
> {
  constructor(
    private storeService: StoreService,
    private storeRepository: StoreRepository,
    protected dataSource: DataSource,
    private i18n: I18nCustomService,
    protected databaseService: DatabaseService
  ) {
    super(
      storeService,
      storeRepository,
      dataSource,
      databaseService,
      i18n,
      {
        CreateDto: new CreateStoreDto(),
        UpdateDto: new UpdateStoreDto(),
        QueryDto: new ListStoreQueryDto(),
      },
      {
        create: [
          {
            id: RoleId.SUPER_ADMIN,
            entity: new Store(),
          },
        ],
        update: [
          {
            id: RoleId.SUPER_ADMIN,
            entity: new Store(),
          },
        ],
        list: [
          {
            id: RoleId.SUPER_ADMIN,
            entity: new Store(),
          },
        ],
        retrieve: [
          {
            id: RoleId.SUPER_ADMIN,
            entity: new Store(),
          },
        ],
        remove: [
          {
            id: RoleId.SUPER_ADMIN,
            entity: new Store(),
          },
        ],
        delete: [
          {
            id: RoleId.SUPER_ADMIN,
            entity: new Store(),
          },
        ],
      },
    );
  }
}
