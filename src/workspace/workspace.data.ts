import { AssetProperty } from 'src/asset-type/entities/asset-property.entity';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { Asset } from 'src/asset/asset.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Cash } from 'src/cash/cash.entity';
import { Customer } from 'src/customer/customer.entity';
import { Device } from 'src/device/device.entity';
import { ExtendedPeriodHistory } from 'src/extended-period-history/extended-period-history.entity';
import { GroupCash } from 'src/group-cash/entity/group-cash.entity';
import { HostServer } from 'src/host-server/host-server.entity';
import { LogAction } from 'src/log-action/log-action.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { Store } from 'src/store/store.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { Warehouse } from 'src/warehouse/warehouse.entity';

export const EntitiesInWorkspace = [
  { key: 'asset', entity: new Asset() },
  { key: 'asset_property', entity: new AssetProperty() },
  { key: 'asset_type', entity: new AssetType() },
  { key: 'bat_ho', entity: new BatHo() },
  { key: 'cash', entity: new Cash() },
  { key: 'customer', entity: new Customer() },
  { key: 'device', entity: new Device() },
  { key: 'extended_period_history', entity: new ExtendedPeriodHistory() },
  { key: 'group_cash', entity: new GroupCash() },
  { key: 'host_server', entity: new HostServer() },
  { key: 'log_action', entity: new LogAction() },
  { key: 'pawn', entity: new Pawn() },
  { key: 'payment_history', entity: new PaymentHistory() },
  { key: 'store', entity: new Store() },
  { key: 'transaction_history', entity: new TransactionHistory()  },
  { key: 'user', entity: new User() },
  { key: 'warehouse', entity: new Warehouse() },
];
