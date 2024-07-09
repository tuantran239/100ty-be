import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { ContractResponse } from 'src/common/types';
import { DefaultQuery } from 'src/common/types/http';
import { formatDate } from 'src/common/utils/time';
import { ContractService } from 'src/contract/contract.service';
import { DatabaseService } from 'src/database/database.service';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  IsNull,
} from 'typeorm';
import { Customer } from './customer.entity';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService extends BaseService<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto
> {
  protected manager: EntityManager;

  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
    private contractService: ContractService,
    private readonly customerRepository: CustomerRepository,
    private i18n: I18nCustomService,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(payload: CreateCustomerDto): Promise<Customer> {
    return await this.customerRepository.createAndSave(payload);
  }

  async update(id: string, payload: UpdateCustomerDto): Promise<any> {
    return await this.customerRepository.updateAndSave({ ...payload, id });
  }

  async delete(id: string): Promise<DeleteResult> {
    return (await this.customerRepository.deleteData({ where: { id } })) as any;
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

  async getTransactionHistory(
    id: string,
    queryDefault: DefaultQuery,
    contractType?: string,
  ) {
    const query = this.customerRepository.filterQuery({ ...queryDefault });

    const customer = await this.customerRepository.findOrThrowError(
      {
        message: this.i18n.getMessage('errors.common.not_found', {
          entity: 'args.entity.customer',
        }),
        checkExist: false,
      },
      { where: { id, ...query } },
    );

    const contracts = await this.contractService.listContract(contractType, {
      where: { customerId: customer.id, deleted_at: IsNull() },
    });

    const contractResponses: ContractResponse[] = contracts.map((contract) => ({
      contractId: contract.contractId,
      loanDate: formatDate(contract.loanDate),
      debitStatus: contract.debitStatus,
      loanAmount: contract.loanAmount,
      latePaymentMoney: contract.latePaymentMoney,
      badDebitMoney: contract.badDebitMoney,
      latePaymentDay: contract.latePaymentDay,
      moneyMustPay: contract.moneyMustPay,
      moneyPaid: contract.moneyPaid,
      contractType: contract.contractType,
      revenueReceived: contract.revenueReceived,
      disbursementMoney: contract.summarize.loan.disbursementMoney,
    }));

    return contractResponses;
  }
}
