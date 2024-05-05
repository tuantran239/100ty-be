import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { convertPostgresDate } from 'src/common/utils/time';

@Injectable()
export class CustomerService extends BaseService<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto
> {
  protected manager: EntityManager;
  private customerRepository: Repository<Customer>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.customerRepository = this.dataSource.manager.getRepository(Customer);
  }

  async create(payload: CreateCustomerDto): Promise<Customer> {
    const customerPersonalID = await this.retrieveOne({
      where: { personalID: payload?.personalID },
    });

    if (customerPersonalID) {
      throw new BadRequestException('Số CMND/CCCD đã tồn tại.');
    }

    const customerPhonenumber = await this.retrieveOne({
      where: { phoneNumber: payload?.phoneNumber },
    });

    if (customerPhonenumber) {
      throw new BadRequestException('Số điện thoại đã tồn tại.');
    }
    const newCustomer = await this.customerRepository.create({
      ...payload,
      images: payload.images ?? [],
      dateOfBirth: convertPostgresDate(payload.dateOfBirth),
    });
    return await this.customerRepository.save(newCustomer);
  }

  async update(id: string, payload: UpdateCustomerDto): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: [{ id }, { personalID: id }],
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const customerPersonalID = await this.retrieveOne({
      where: { personalID: payload?.personalID },
    });

    if (customerPersonalID && customerPersonalID.id !== customer.id) {
      throw new BadRequestException('Số CMND/CCCD đã tồn tại.');
    }

    const customerPhonenumber = await this.retrieveOne({
      where: { phoneNumber: payload?.phoneNumber },
    });

    if (customerPhonenumber && customerPhonenumber.id !== customer.id) {
      throw new BadRequestException('Số điện thoại đã tồn tại.');
    }

    if (payload.dateOfBirth) {
      payload.dateOfBirth = convertPostgresDate(payload.dateOfBirth);
    }

    return await this.customerRepository.update(
      { id: customer.id },
      { ...payload, updated_at: new Date() },
    );
  }

  async delete(id: string): Promise<DeleteResult> {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new Error();
    }

    return await this.customerRepository.delete({ id });
  }

  async list(options: FindManyOptions<Customer>): Promise<Customer[]> {
    return this.customerRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<Customer>,
  ): Promise<[Customer[], number]> {
    return this.customerRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<Customer> {
    return this.customerRepository.findOne({ where: { id } });
  }

  retrieveOne(options: FindOneOptions<Customer>): Promise<Customer> {
    return this.customerRepository.findOne(options);
  }
}
