import { Customer } from 'src/customer/customer.entity';
import { Cash } from '../cash.entity';

export class CashResponseDto extends Cash {
  admin: string;
  contractId: string;
  rootMoney: number;
  interestMoney: number;
  customer: Customer | object;
}
