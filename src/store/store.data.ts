import { Asset } from 'src/asset/asset.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Cash } from 'src/cash/cash.entity';
import { Customer } from 'src/customer/customer.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { Warehouse } from 'src/warehouse/warehouse.entity';

export const EntitiesInStore = [
  { key: 'asset', entity: new Asset() },
  { key: 'bat_ho', entity: new BatHo() },
  { key: 'cash', entity: new Cash() },
  { key: 'customer', entity: new Customer() },
  { key: 'pawn', entity: new Pawn() },
  { key: 'payment_history', entity: new PaymentHistory() },
  { key: 'transaction_history', entity: new TransactionHistory() },
  { key: 'user', entity: new User() }
];
