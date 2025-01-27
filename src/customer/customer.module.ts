import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { ContractModule } from 'src/contract/contract.module';
import { CustomerRepositoryProvider } from './customer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), ContractModule],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepositoryProvider],
  exports: [CustomerService],
})
export class CustomerModule {}
