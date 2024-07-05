import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../db/data.source';
import configuration from './common/config';

import { ThrottlerModule } from '@nestjs/throttler';

import { CacheModule } from '@nestjs/cache-manager';
import { APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import 'dotenv/config';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { AssetTypeModule } from './asset-type/asset-type.module';
import { AssetModule } from './asset/asset.module';
import { AuthModule } from './auth/auth.module';
import { BatHoModule } from './bat-ho/bat-ho.module';
import { CacheCustomModule } from './cache/cache.module';
import { CashModule } from './cash/cash.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BodyValidationPipe } from './common/pipe/body-validation.pipe';
import { ContractModule } from './contract/contract.module';
import { CsvModule } from './csv/csv.module';
import { CustomerModule } from './customer/customer.module';
import { DatabaseModule } from './database/database.module';
import { DeviceModule } from './device/device.module';
import { ExtendedPeriodHistoryModule } from './extended-period-history/extended-period-history.module';
import { GroupCashModule } from './group-cash/group-cash.module';
import { HostServerModule } from './host-server/host-server.module';
import { InitModule } from './init/init.module';
import { LogActionModule } from './log-action/log-action.module';
import { LoggerServerModule } from './logger/logger-server.module';
import { PawnModule } from './pawn/pawn.module';
import { PaymentHistoryModule } from './payment-history/payment-history.module';
import { RoleModule } from './role/role.module';
import { StatisticsModule } from './statistics/statistics.module';
import { StatisticsService } from './statistics/statistics.service';
import { StoreModule } from './store/store.module';
import { TransactionHistoryModule } from './transaction-history/transaction-history.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    LoggerServerModule,
    UserModule,
    AuthModule,
    CustomerModule,
    CashModule,
    RoleModule,
    UploadModule,
    CloudinaryModule,
    BatHoModule,
    PaymentHistoryModule,
    TransactionHistoryModule,
    HostServerModule,
    DeviceModule,
    DatabaseModule,
    LogActionModule,
    StatisticsModule,
    CsvModule,
    GroupCashModule,
    AssetTypeModule,
    PawnModule,
    ContractModule,
    ExtendedPeriodHistoryModule,
    CacheCustomModule,
    WarehouseModule,
    AssetModule,
    InitModule,
    StoreModule,
    WorkspaceModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: BodyValidationPipe,
    },
    {
      provide: APP_PIPE,
      useClass: BodyValidationPipe,
    },
    StatisticsService,
  ],
})
export class AppModule {}
