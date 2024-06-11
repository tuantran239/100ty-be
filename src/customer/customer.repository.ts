import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { convertPostgresDate } from 'src/common/utils/time';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

export interface CustomerRepository extends Repository<Customer> {
  this: CustomerRepository;

  checkCustomerExist(
    options: FindOneOptions<Customer>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<Customer>;

  createCustomer(payload: CreateCustomerDto): Promise<Customer>;

  updateCustomer(
    payload: UpdateCustomerDto & { id: string },
  ): Promise<Customer>;
}

export const CustomerRepositoryProvider = {
  provide: getRepositoryToken(Customer),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(Customer).extend(customerCustomRepository);
  },
};

export const customerCustomRepository: Pick<CustomerRepository, any> = {
  async checkCustomerExist(
    this: CustomerRepository,
    options: FindOneOptions<Customer>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const customer = await this.findOne(options);

    if (throwError) {
      if (exist && customer) {
        throw new Error(throwError.message ?? 'Customer exist');
      } else if (!exist && !customer) {
        throw new Error(
          throwError.message ?? 'Customer not found or not exist',
        );
      }
    }

    return customer;
  },

  async createCustomer(
    this: CustomerRepository,
    payload: CreateCustomerDto,
  ): Promise<Customer> {
    await this.checkCustomerExist(
      { where: { personalID: payload.personalID } },
      { message: 'Số CMND/CCCD đã tồn tại.' },
      true,
    );

    await this.checkCustomerExist(
      { where: { phoneNumber: payload.phoneNumber } },
      { message: 'Số điện thoại đã tồn tại.' },
      true,
    );

    let newCustomer = await this.create({
      ...payload,
      images: payload.images ?? [],
      dateOfBirth: convertPostgresDate(payload.dateOfBirth),
    });

    newCustomer = await this.save(newCustomer);

    return newCustomer;
  },

  async updateCustomer(
    this: CustomerRepository,
    payload: UpdateCustomerDto & { id: string },
  ): Promise<Customer> {
    const { id } = payload;

    const customer = await this.checkCustomerExist({ where: { id } }, {});

    if (payload.phoneNumber && customer.phoneNumber !== payload.phoneNumber) {
      await this.checkCustomerExist(
        { where: { phoneNumber: payload.phoneNumber } },
        { message: 'Số điện thoại đã tồn tại.' },
        true,
      );
    }

    if (payload.personalID && customer.personalID !== payload.personalID) {
      await this.checkCustomerExist(
        { where: { personalID: payload.personalID } },
        { message: 'Số CMND/CCCD đã tồn tại.' },
        true,
      );
    }

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const customerValue = customer[key];

      if (customerValue !== undefined && customerValue !== payloadValue) {
        customer[key] = payloadValue;
      }
    }

    customer.updated_at = new Date();

    await this.save({
      ...customer,
      dateOfBirth: payload.dateOfBirth
        ? convertPostgresDate(payload.dateOfBirth)
        : customer.dateOfBirth,
    });

    return customer;
  },
};
