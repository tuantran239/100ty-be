import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { GroupCash } from './entity/group-cash.entity';
import { CreateGroupCashDto } from './dto/create-group-cash.dto';
import { UpdateGroupCashDto } from './dto/update-group-cash.dto';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Repository,
} from 'typeorm';
import { DatabaseService } from 'src/database/database.service';
import {
  InitGroupCashContractData,
  InitGroupCashData,
} from './group-cash.data';

@Injectable()
@Injectable()
export class GroupCashService extends BaseService<
  GroupCash,
  CreateGroupCashDto,
  UpdateGroupCashDto
> {
  protected manager: EntityManager;
  private groupCashRepository: Repository<GroupCash>;

  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
    this.groupCashRepository = this.dataSource.manager.getRepository(GroupCash);
  }

  async createInit() {
    let total = InitGroupCashData.length + InitGroupCashContractData.length;
    let updated = 0;
    let created = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { groupCashRepository } = repositories;

      for (let i = 0; i < InitGroupCashData.length; i++) {
        const initData = InitGroupCashData[i];

        const groupCash = await groupCashRepository.findOne({
          where: { id: initData.id },
        });

        if (!groupCash) {
          const newGroupCash = await groupCashRepository.create({
            ...initData,
          });

          await groupCashRepository.save(newGroupCash);

          created++;
        } else {
          updated++;
        }
      }

      for (let i = 0; i < InitGroupCashContractData.length; i++) {
        const initData = InitGroupCashContractData[i];

        const groupCash = await groupCashRepository.findOne({
          where: { id: initData.id },
        });

        if (!groupCash) {
          const newGroupCash = await groupCashRepository.create({
            ...initData,
          });

          await groupCashRepository.save(newGroupCash);

          created++;
        } else {
          updated++;
        }
      }
    });

    console.log(
      `>>>>>>>>>>>>>>>>>>>>>>>>>> Create Init Group Cash: { created: ${created}/${total}, updated: ${updated}/${total}  }`,
    );
  }

  async convertGroupCashContract() {
    let total = 0;
    let updated = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { cashRepository } = repositories;

      const cashContracts = await cashRepository.find({
        where: { isContract: true, groupId: IsNull() },
      });

      total = cashContracts.length;

      await Promise.all(
        cashContracts.map(async (cashContract) => {
          const groupContract = InitGroupCashContractData.find(
            (groupCash) => groupCash.filterType === cashContract.filterType,
          );

          if (groupContract) {
            await cashRepository.update(
              { id: cashContract.id },
              { groupId: groupContract.id },
            );
            updated++;
          }
        }),
      );
    });

    console.log(
      `>>>>>>>>>>>>>>>>>>>>>>>>>> Update Group Cash Contract: { updated: ${updated}/${total}  }`,
    );
  }

  async create(payload: CreateGroupCashDto): Promise<GroupCash> {
    const groupCash = await this.groupCashRepository.findOne({
      where: {
        id: payload.id,
      },
    });

    if (groupCash) {
      throw new Error('Mã nhóm đã tồn tại');
    }

    const newGroupCash = await this.groupCashRepository.create(payload);
    return await this.groupCashRepository.save(newGroupCash);
  }

  async update(id: string, payload: UpdateGroupCashDto): Promise<any> {
    const groupCash = await this.groupCashRepository.findOne({ where: { id } });

    if (!groupCash) {
      throw new Error('Không tìm thấy nhóm thu chi');
    }

    return await this.groupCashRepository.update(
      { id },
      {
        ...payload,
        updated_at: new Date(),
      },
    );
  }

  async delete(id: string): Promise<any> {
    return await this.groupCashRepository.delete({ id });
  }

  async list(options: FindManyOptions<GroupCash>): Promise<GroupCash[]> {
    return this.groupCashRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<GroupCash>,
  ): Promise<[GroupCash[], number]> {
    return this.groupCashRepository.findAndCount(options);
  }

  async listGroupOption(
    options: FindManyOptions<GroupCash>,
  ): Promise<GroupCash[]> {
    return this.groupCashRepository.find(options);
  }

  async retrieveById(id: string): Promise<GroupCash> {
    return this.groupCashRepository.findOne({ where: { id } });
  }

  async retrieveOne(options: FindOneOptions<GroupCash>): Promise<GroupCash> {
    return this.groupCashRepository.findOne(options);
  }
}
