import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractResponse } from 'src/common/interface';
import { BaseService } from 'src/common/service/base.service';
import { ContractService } from 'src/contract/contract.service';
import { DatabaseService } from 'src/database/database.service';
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
import { formatDate } from 'src/common/utils/time';

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
    @InjectRepository(Customer)
    private readonly customerRepository: CustomerRepository,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(payload: CreateCustomerDto): Promise<Customer> {
    return await this.customerRepository.createCustomer(payload);
  }

  async update(id: string, payload: UpdateCustomerDto): Promise<any> {
    return await this.customerRepository.updateCustomer({ ...payload, id });
  }

  async delete(id: string): Promise<DeleteResult> {
    await this.customerRepository.checkCustomerExist(
      { where: { id } },
      { message: `Không tìm thấy khách hàng` },
    );

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

  async getTransactionHistory(id: string, contractType?: string) {
    const customer = await this.customerRepository.checkCustomerExist(
      { where: { id } },
      { message: 'Không tìm thấy khách hàng' },
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
