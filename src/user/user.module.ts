import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RoleModule } from 'src/role/role.module';
import { UserRepositoryProvider } from './user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RoleModule],
  controllers: [UserController],
  providers: [UserService, UserRepositoryProvider],
  exports: [UserService],
})
export class UserModule {}
