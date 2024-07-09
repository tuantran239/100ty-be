import {
  BaseRepository,
  CheckValid,
  CreateAndSaveCheckValid,
  MapPayload,
} from 'src/common/repository/base.repository';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { convertPostgresDate } from 'src/common/utils/time';

const CUSTOMER_RELATIONS = ['store', 'user', 'pawns', 'batHos'];

export class CustomerRepository extends BaseRepository<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto
> {
  constructor(
    @InjectRepository(Customer)
    protected repository: Repository<Customer>,
    public i18n: I18nCustomService,
  ) {
    super(repository, CUSTOMER_RELATIONS, i18n, repository.target, 'customer');
  }

  setCheckValid(
    payload: CreateCustomerDto | UpdateCustomerDto | Record<string, any>,
  ): CheckValid<Customer> {
    const personalIDUnique: CreateAndSaveCheckValid<Customer> = {
      type: 'unique',
      message: this.i18n.getMessage('errors.common.existed', {
        field: this.i18n.getMessage('args.field.personal_id'),
        entity: this.i18n.getMessage('args.entity.customer'),
        value: payload.personalID,
      }),
      options: {
        where: {
          phoneNumber: payload.personalID,
        },
      },
      field: 'personalID',
      payload,
    };

    const phoneNumberUnique: CreateAndSaveCheckValid<Customer> = {
      type: 'unique',
      message: this.i18n.getMessage('errors.common.existed', {
        field: this.i18n.getMessage('args.field.phone_number'),
        entity: this.i18n.getMessage('args.entity.customer'),
        value: payload.phoneNumber,
      }),
      options: {
        where: {
          phoneNumber: payload.phoneNumber,
        },
      }, 
      field: 'phoneNumber',
      payload,
    };

    const notFound: CreateAndSaveCheckValid<Customer> = {
      type: 'not_found',
      message: this.i18n.getMessage('errors.common.not_found', {
        field: this.i18n.getMessage('args.field.id'),
        entity: this.i18n.getMessage('args.entity.customer'),
        value: (payload as UpdateCustomerDto).id,
      }),
      options: {
        where: {
          id: (payload as UpdateCustomerDto).id,
        },
      },
      field: 'id',
      payload,
    };

    const createAndSave: CreateAndSaveCheckValid<Customer>[] = [
      personalIDUnique,
      phoneNumberUnique,
    ];

    const updateAndSave: CreateAndSaveCheckValid<Customer>[] = [
      personalIDUnique,
      phoneNumberUnique,
      notFound,
    ];

    return { createAndSave, updateAndSave };
  }

  setQueryDefault(
    payload?: CreateCustomerDto | UpdateCustomerDto | Record<string, any>,
  ): FindOptionsWhere<Customer> {
    return {
      workspaceId: payload.workspaceId,
      storeId: payload.storeId,
    };
  }

  mapResponse(payload: Customer): CustomerResponseDto {
    return payload;
  }

  async mapPayload(
    data: MapPayload<CreateCustomerDto, UpdateCustomerDto>,
  ): Promise<any> {
    const { type, payload } = data;

    if (type === 'create') {
      return {
        ...payload,
        images: payload.images ?? [],
        dateOfBirth: convertPostgresDate(payload.dateOfBirth),
      };
    } else if (type === 'update') {
      return payload;
    }
  }

  async calculateTotal(
    this: CustomerRepository,
    options,
  ): Promise<{ totalBadDebit: number }> {
    const customers = await this.find(options);

    const totalBadDebit = customers.reduce(
      (total, customer) => customer.debtMoney + total,
      0,
    );

    return { totalBadDebit };
  }
}