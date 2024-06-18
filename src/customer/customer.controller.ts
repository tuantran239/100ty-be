import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import RouterUrl from 'src/common/constant/router';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ResponseData } from 'src/common/types';
import { CustomerQuery } from 'src/common/types/query';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { getSearch } from 'src/common/utils/query';
import { User } from 'src/user/user.entity';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ContractService } from 'src/contract/contract.service';
import { IsNull } from 'typeorm';
import { getSearchName } from 'src/common/utils/get-full-name';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomerRepository } from './customer.repository';
import { RoleName } from 'src/role/role.type';
import { DatabaseService } from 'src/database/database.service';

@ApiTags('Customer')
@Controller(RouterUrl.CUSTOMER.ROOT)
export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private contractService: ContractService,
    private databaseService: DatabaseService,
    @InjectRepository(Customer)
    private readonly customerRepository: CustomerRepository,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.CUSTOMER.CREATE)
  async createCustomer(
    @Body(new BodyValidationPipe()) payload: CreateCustomerDto,
    @Res() res: Response,
  ) {
    try {
      const customer = await this.customerService.create(payload);
      const responseData: ResponseData = {
        message: 'success',
        data: { customer },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.CUSTOMER.RETRIEVE)
  async getCustomer(@Res() res: Response, @Req() req: Request) {
    try {
      const { id } = req.params;

      const customer = await this.customerService.retrieveOne({
        where: [{ id }, { personalID: id }, { phoneNumber: id }],
        relations: ['batHos'],
      });

      if (!customer) {
        throw new NotFoundException('Không tìm thấy khách hàng');
      }

      const responseData: ResponseData = {
        message: 'success',
        data: { customer },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(RouterUrl.CUSTOMER.LIST)
  async listCustomer(@Res() res: Response, @Req() req: Request) {
    try {
      const me = req.user as User;

      const user = this.databaseService
        .getRepositories()
        .userRepository.filterRole(me);

      const { search, page, pageSize, isDebt } = req.body as CustomerQuery;

      const searchType = parseInt((search as string) ?? '');

      const where = [];

      const query = { isDebt: isDebt };

      if (!Number.isNaN(searchType)) {
        where.push({ ...query, personalID: getSearch(search, 'both') });
        where.push({ ...query, phoneNumber: getSearch(search, 'both') });
      } else if (search && search.trim().length > 0) {
        const searchResults = getSearchName(search);

        for (let i = 0; i < searchResults.length; i++) {
          const { firstName, lastName } = searchResults[i];

          if (firstName && !lastName) {
            where.push({
              ...query,
              lastName: getSearch(firstName, 'both'),
            });
          }

          if (lastName && !firstName) {
            where.push({ ...query, firstName: getSearch(lastName, 'both') });
          }

          if (firstName && lastName) {
            where.push({
              ...query,
              firstName: getSearch(lastName, 'both'),
              lastName: getSearch(firstName, 'both'),
            });
          }
        }
      } else {
        where.push({ ...query });
      }

      const data = await this.customerService.listAndCount({
        where: [...where],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
      });

      const totalMoney = await this.customerRepository.calculateTotal({
        where: [...where],
      });

      const list_customer = [];

      await Promise.all(
        data[0].map(async (customer) => {
          const contracts = await this.contractService.listContract(null, {
            where: {
              user,
              deleted_at: IsNull(),
              customer: {
                id: customer.id,
              },
            },
            relations: ['customer', 'user', 'paymentHistories'],
          });
          list_customer.push({ ...customer, contracts });
        }),
      );

      const responseData: ResponseData = {
        message: 'success',
        data: { list_customer: data[0], total: data[1], totalMoney },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(RouterUrl.CUSTOMER.UPDATE)
  async updateCustomer(
    @Body(new BodyValidationPipe()) payload: UpdateCustomerDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { id } = req.params;

      const customer = await this.customerService.update(id, payload);

      const responseData: ResponseData = {
        message: 'success',
        data: { customer },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.CUSTOMER.TRANSACTION_HISTORY)
  async getTransactionHistory(@Res() res: Response, @Req() req: Request) {
    try {
      const { id } = req.params;

      const { contractType } = req.query;

      const list_contract = await this.customerService.getTransactionHistory(
        id,
        contractType as string,
      );

      const responseData: ResponseData = {
        message: 'success',
        data: { list_contract },
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
