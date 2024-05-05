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
import { ResponseData, RoleId, RoleName } from 'src/common/interface';
import { CustomerQuery } from 'src/common/interface/query';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { getSearch } from 'src/common/utils/query';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { User } from 'src/user/user.entity';
import { DatabaseService } from 'src/database/database.service';

@ApiTags('Customer')
@Controller(RouterUrl.CUSTOMER.ROOT)
export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private databaseService: DatabaseService,
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

      const role = me.roles[0];

      let batHos = undefined;

      if (role.id === RoleId.USER) {
        batHos = {
          userId: me.id,
        };
      } else if (role.id === RoleId.ADMIN) {
        batHos = {
          user: [
            {
              managerId: me.id,
            },
            {
              id: me.id,
            },
          ],
        };
      }

      const { search, page, pageSize, isDebt } = req.body as CustomerQuery;

      const searchType = parseInt((search as string) ?? '');

      const where = [];

      const query = { isDebt: isDebt, batHos };

      if (!Number.isNaN(searchType)) {
        where.push({ ...query, personalID: getSearch(search, 'both') });
        where.push({ ...query, phoneNumber: getSearch(search, 'both') });
      } else if (search && search.trim().length > 0) {
        where.push({ ...query, firstName: getSearch(search, 'both') });
        where.push({ ...query, lastName: getSearch(search, 'both') });
      } else {
        where.push({ ...query });
      }

      const data = await this.customerService.listAndCount({
        where: [...where],
        take: pageSize ?? 10,
        skip: ((page ?? 1) - 1) * (pageSize ?? 10),
        relations: ['batHos', 'batHos.user'],
      });

      const responseData: ResponseData = {
        message: 'success',
        data: { list_customer: data[0], total: data[1] },
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

      const list_contract =
        await this.customerService.getTransactionHistory(id);

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
