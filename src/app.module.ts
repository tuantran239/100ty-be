import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../db/data.source';
import configuration from './common/config';

import { ThrottlerModule } from '@nestjs/throttler';

import { APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import 'dotenv/config';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { BatHoModule } from './bat-ho/bat-ho.module';
import { CashModule } from './cash/cash.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BodyValidationPipe } from './common/pipe/body-validation.pipe';
import { CsvModule } from './csv/csv.module';
import { CustomerModule } from './customer/customer.module';
import { DatabaseModule } from './database/database.module';
import { DeviceModule } from './device/device.module';
import { HostServerModule } from './host-server/host-server.module';
import { LogActionModule } from './log-action/log-action.module';
import { LoggerServerModule } from './logger/logger-server.module';
import { PaymentHistoryModule } from './payment-history/payment-history.module';
import { RoleModule } from './role/role.module';
import { StatisticsModule } from './statistics/statistics.module';
import { StatisticsService } from './statistics/statistics.service';
import { TransactionHistoryModule } from './transaction-history/transaction-history.module';
import { UpdateStatusModule } from './update-status/update-status.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';
import { GroupCashModule } from './group-cash/group-cash.module';

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
    UpdateStatusModule,
    DatabaseModule,
    LogActionModule,
    StatisticsModule,
    CsvModule,
    GroupCashModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: BodyValidationPipe,
    },
    StatisticsService,
  ],
})
export class AppModule {}
