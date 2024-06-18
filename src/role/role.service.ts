import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { DatabaseService } from 'src/database/database.service';
import { InitRoleData } from './role.data';

@Injectable()
export class RoleService extends BaseService<
  Role,
  CreateRoleDto,
  UpdateRoleDto
> {
  protected manager: EntityManager;
  private roleRepository: Repository<Role>;
  private userRoleRepository: Repository<UserRole>;

  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
    this.roleRepository = this.dataSource.manager.getRepository(Role);
    this.userRoleRepository = this.dataSource.manager.getRepository(UserRole);
  }

  async createInit() {
    let total = InitRoleData.length;
    let updated = 0;
    let created = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { roleRepository } = repositories;

      for (let i = 0; i < total; i++) {
        const initData = InitRoleData[i];

        const role = await roleRepository.findOne({
          where: { id: initData.id },
        });

        if (!role) {
          const newRole = await roleRepository.create({
            name: initData.name,
            level: initData.level,
            permissions: [...initData.permissions],
            id: initData.id,
          });

          await roleRepository.save(newRole);

          created++;
        } else {
          updated++;
        }
      }
    });

    console.log(
      `>>>>>>>>>>>>>>>>>>>>>>>>>> Create Init Role: { created: ${created}/${total}, updated: ${updated}/${total}  }`,
    );
  }

  async createUserRole(payload: {
    user_id: string;
    role_id: string;
  }): Promise<UserRole> {
    const newUserRole = await this.userRoleRepository.create(payload);
    return await this.userRoleRepository.save(newUserRole);
  }

  async retrieveOneUserRole(
    options: FindOneOptions<UserRole>,
  ): Promise<UserRole> {
    return await this.userRoleRepository.findOne(options);
  }

  create(payload: CreateRoleDto): Promise<Role> {
    console.log(payload);
    throw new Error('Method not implemented.');
  }

  async update(id: string, payload: UpdateRoleDto): Promise<any> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new Error('Role not found');
    }

    return await this.roleRepository.update(
      { id },
      { permissions: payload.permissions },
    );
  }

  delete(id: string): Promise<DeleteResult> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  list(options: FindManyOptions<Role>): Promise<Role[]> {
    return this.roleRepository.find(options);
  }

  listAndCount(options: FindManyOptions<Role>): Promise<[Role[], number]> {
    console.log(options);
    throw new Error('Method not implemented.');
  }

  retrieveById(id: string): Promise<Role> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  retrieveOne(options: FindOneOptions<Role>): Promise<Role> {
    return this.roleRepository.findOne(options);
  }

  async checkLevelRole(
    userRoleId: string,
    roleId: string,
    checkSameLevel?: boolean,
  ) {
    const role = InitRoleData.find((roleData) => roleData.id === roleId);

    if (!role) {
      throw new Error('Quyền không tồn tại');
    }

    const userRole = InitRoleData.find(
      (roleData) => userRoleId === roleData.id,
    );

    if (!userRole) {
      throw new Error('Quyền không tồn tại');
    }

    if (role.level > userRole.level) {
      throw new Error('Quyền nhỏ hơn, không đủ quyền thực hiện chức năng này.');
    }

    if (checkSameLevel && role.level === userRole.level) {
      throw new Error('Quyền nhỏ hơn, không đủ quyền thực hiện chức năng này.');
    }

    return true;
  }
}
