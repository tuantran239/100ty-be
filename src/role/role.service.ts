import { Injectable } from '@nestjs/common';
import { InitRoleData } from 'src/common/constant/data';
import { BaseService } from 'src/common/service/base.service';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class RoleService extends BaseService<
  Role,
  CreateRoleDto,
  UpdateUserDto
> {
  protected manager: EntityManager;
  private roleRepository: Repository<Role>;
  private userRoleRepository: Repository<UserRole>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.roleRepository = this.dataSource.manager.getRepository(Role);
    this.userRoleRepository = this.dataSource.manager.getRepository(UserRole);

    const roleRepo = this.roleRepository;
    const dataSr = this.dataSource;

    async function init() {
      const queryRunner = await dataSr.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const roleRepository = queryRunner.manager.getRepository(Role);
        const userRoleRepository = queryRunner.manager.getRepository(UserRole);
        const roles = await roleRepository.find();

        if (roles.length === 0) {
          await Promise.all(
            InitRoleData.map(async (role) => {
              const newRole = await roleRepository.create({
                name: role.name,
                level: role.level,
                permissions: { data: [...role.permissions] },
                id: role.id,
              });
              await roleRepo.save(newRole);
            }),
          );
        } else if (roles.length < InitRoleData.length) {
          for (let i = 0; i < InitRoleData.length; i++) {
            const roleData = InitRoleData[i];
            const roleFind = roles.find((role) => role.name === roleData.name);
            if (!roleFind) {
              const newRole = await roleRepo.create({
                name: roleData.name,
                level: roleData.level,
                permissions: { data: [...roleData.permissions] },
                id: roleData.id,
              });
              await roleRepo.save(newRole);
            }
          }
        } else {
          for (let i = 0; i < InitRoleData.length; i++) {
            const roleData = InitRoleData[i];
            const roleFind = roles.find((role) => role.name === roleData.name);
            if (
              roleFind &&
              (!roleFind.permissions || roleFind.id !== roleData.id)
            ) {
              const newRole = await roleRepo.create({
                name: roleData.name,
                level: roleData.level,
                permissions: { data: [...roleData.permissions] },
                id: roleData.id,
              });

              await roleRepo.save(newRole);

              const userRoles = await userRoleRepository.find({
                where: { role_id: roleFind.id },
              });

              await Promise.all(
                userRoles.map(async (userRole) => {
                  const newUserRole = await userRoleRepository.create({
                    role_id: roleData.id,
                    user_id: userRole.user_id,
                  });
                  await userRoleRepository.save(newUserRole);
                }),
              );

              await roleRepository.delete(roleFind.id);

              await await Promise.all(
                userRoles.map(async (userRole) => {
                  await userRoleRepository.delete(userRole.id);
                }),
              );
            }
          }
        }
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    }

    init();
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

  update(id: string, payload: UpdateUserDto): Promise<any> {
    console.log(id, payload);
    throw new Error('Method not implemented.');
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
