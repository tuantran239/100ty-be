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
  IsNull,
  Repository,
} from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { ContractResponse, ContractType } from 'src/common/interface';
import { PaymentStatusHistory } from 'src/common/interface/history';
import { DebitStatus } from 'src/common/interface/bat-ho';

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

      let latePaymentDay = 0;
      let latePaymentMoney = 0;
      let badDebitMoney = 0;

      const moneyPaidNumber = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      const today = formatDate(new Date());

      const lastPaymentHistoryUnfinish = batHo.paymentHistories
        .sort((p1, p2) => p1.rowId - p2.rowId)
        .find(
          (paymentHistory) =>
            (paymentHistory.paymentStatus == PaymentStatusHistory.UNFINISH ||
              paymentHistory.paymentStatus == null) &&
            formatDate(paymentHistory.startDate) !== today &&
            new Date(paymentHistory.startDate).getTime() <
              new Date(convertPostgresDate(today)).getTime(),
        );

      if (lastPaymentHistoryUnfinish) {
        latePaymentDay = Math.round(
          (new Date(convertPostgresDate(today)).getTime() -
            new Date(lastPaymentHistoryUnfinish.startDate).getTime()) /
            86400000,
        );

        latePaymentMoney = batHo.paymentHistories
          .sort((p1, p2) => p1.rowId - p2.rowId)
          .reduce((total, paymentHistory) => {
            if (
              (paymentHistory.paymentStatus == PaymentStatusHistory.UNFINISH ||
                paymentHistory.paymentStatus == null) &&
              formatDate(paymentHistory.startDate) !== today &&
              new Date(paymentHistory.startDate).getTime() <
                new Date(convertPostgresDate(today)).getTime()
            ) {
              return paymentHistory.payNeed + total;
            }
            return total;
          }, 0);
      }

      if (batHo.debitStatus == DebitStatus.BAD_DEBIT) {
        badDebitMoney = batHo.paymentHistories.reduce(
          (total, paymentHistory) => {
            if (paymentHistory.paymentStatus != PaymentStatusHistory.FINISH) {
              return total + paymentHistory.payNeed;
            }
            return total;
          },
          0,
        );
      }

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
