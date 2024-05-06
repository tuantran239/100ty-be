import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContractResponse, ContractType } from 'src/common/interface';
import { PaymentStatusHistory } from 'src/common/interface/history';
import { BaseService } from 'src/common/service/base.service';
import { calculateLateAndBadPaymentIcloud } from 'src/common/utils/calculate';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Repository,
} from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService extends BaseService<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto
> {
  protected manager: EntityManager;
  private customerRepository: Repository<Customer>;
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {
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

  async retrieveOne(options: FindOneOptions<Customer>): Promise<Customer> {
    return this.customerRepository.findOne(options);
  }

  async getTransactionHistory(id: string) {
    const { batHoRepository } = this.databaseService.getRepositories();

    const customer = await this.retrieveOne({
      where: { id },
    });

    if (!customer) {
      throw new Error('Không tìm thấy khách hàng');
    }

    const batHoContracts = await batHoRepository.find({
      where: { customerId: customer.id, deleted_at: IsNull() },
      relations: ['paymentHistories'],
    });

    const contractResponses: ContractResponse[] = [];

    for (let i = 0; i < batHoContracts.length; i++) {
      const batHo = batHoContracts[i];

      const paymentHistories = batHo.paymentHistories;

      const { latePaymentDay, latePaymentMoney, badDebitMoney } =
        calculateLateAndBadPaymentIcloud(
          batHo.paymentHistories ?? [],
          batHo.debitStatus,
        );

      const moneyPaidNumber = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      contractResponses.push({
        badDebitMoney,
        moneyPaid: moneyPaidNumber,
        latePaymentDay,
        latePaymentMoney,
        contractId: batHo.contractId,
        loanDate: formatDate(batHo.loanDate),
        debitStatus: batHo.debitStatus,
        loanAmount: batHo.loanAmount,
        moneyMustPay: batHo.revenueReceived,
        contractType: ContractType.BAT_HO,
      });
    }

    return contractResponses;
  }
}
