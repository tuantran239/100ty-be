import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/service/base.service';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { GroupCashStatus } from 'src/group-cash/group-cash.type';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import {
  Between,
  DataSource,
  EntityManager,
  Equal,
  FindManyOptions,
  FindOneOptions,
  ILike,
  IsNull,
  Or,
} from 'typeorm';
import { Cash } from './cash.entity';
import { CashRepository } from './cash.repository';
import { CashFilterType, CashType } from './cash.type';
import { CreateCashDto } from './dto/create-cash.dto';
import { ListCashQueryDto } from './dto/list-cash-query.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

@Injectable()
export class CashService extends BaseService<
  Cash,
  CreateCashDto,
  UpdateCashDto
> {
  protected manager: EntityManager;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Cash)
    private readonly cashRepository: CashRepository,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(payload: CreateCashDto): Promise<Cash> {
    return this.cashRepository.createCash(payload);
  }

  async update(id: string, payload: UpdateCashDto): Promise<any> {
    return this.cashRepository.updateCash({ ...payload, id });
  }

  async delete(id: string): Promise<any> {
    const cash = await this.cashRepository.findOne({ where: { id } });

    if (!cash) {
      throw new Error('Quỹ tiền không tồn tại');
    }

    return await this.cashRepository.delete({ id });
  }

  async list(options: FindManyOptions<Cash>): Promise<Cash[]> {
    return this.cashRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<Cash>,
  ): Promise<[Cash[], number]> {
    return this.cashRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<Cash> {
    return this.cashRepository.findOne({ where: { id } });
  }

  async retrieveOne(options: FindOneOptions<Cash>): Promise<Cash> {
    return this.cashRepository.findOne(options);
  }

  async listCash(queryDto: ListCashQueryDto, me: UserResponseDto) {
    const { userRepository, cashRepository } =
      this.databaseService.getRepositories();

    const user = userRepository.filterQuery({
      workspaceId: queryDto.workspaceId,
      userId: me.id,
      me,
      storeId: queryDto.storeId,
    });

    const {
      traders,
      staff,
      fromDate,
      toDate,
      page,
      pageSize,
      contractType,
      type,
      groupId,
      isContract,
    } = queryDto;

    const relations = [
      'batHo',
      'batHo.user',
      'batHo.customer',
      'batHo.user.manager',
      'group',
      'pawn',
      'pawn.user',
      'pawn.customer',
      'pawn.user.manager',
    ];

    const where = [];
    const from = fromDate ? fromDate : formatDate(new Date());
    const to = toDate ? toDate : formatDate(new Date());

    let filterCashQuery: any = {
      user,
    };

    if (isContract) {
      filterCashQuery = {
        filterType: Or(
          Equal(CashFilterType.PAYMENT_CONTRACT),
          Equal(CashFilterType.RECEIPT_CONTRACT),
          Equal(CashFilterType.LOAN_MORE_CONTRACT),
          Equal(CashFilterType.DOWN_ROOT_MONEY),
        ),
      };
    } else if (groupId && groupId.trim().length > 0) {
      filterCashQuery = {
        groupId,
      };
    }

    const query = {
      createAt: Between(convertPostgresDate(from), convertPostgresDate(to)),
      deleted_at: IsNull(),
      contractType: contractType,
      type: type == null ? undefined : type,
      ...filterCashQuery,
      isContract: isContract ? Equal(true) : Or(Equal(false), IsNull()),
      group: isContract
        ? undefined
        : {
            status: GroupCashStatus.ACTIVE,
          },
    };

    if (
      (!traders || (traders as string).trim().length === 0) &&
      (!staff || (staff as string).trim().length === 0)
    ) {
      where.push({
        ...query,
      });
    } else {
      if (traders) {
        where.push({
          ...query,
          traders: ILike(traders as string),
        });
      }
      if (staff) {
        where.push({
          ...query,
          staff: ILike(staff as string),
        });
      }
    }

    const data = await this.listAndCount({
      where: [...where],
      take: pageSize ?? 10,
      skip: ((page ?? 1) - 1) * (pageSize ?? 10),
      order: { createAt: 'DESC' },
      relations,
    });

    const result = await this.list({
      where: [...where],
    });

    const totalMoney = await this.cashRepository.calculateTotal({
      where: [...where],
      relations,
    });

    const count = {
      payment: result.reduce((total, cash) => {
        if (cash.type === CashType.PAYMENT) {
          return total + cash.amount;
        }
        return total;
      }, 0),
      receipt: result.reduce((total, cash) => {
        if (cash.type === CashType.RECEIPT) {
          return total + cash.amount;
        }
        return total;
      }, 0),
    };

    data[0] = data[0].map((cash) => this.cashRepository.mapCashResponse(cash));

    return { list_cash: data[0], total: data[1], count, totalMoney };
  }
}
