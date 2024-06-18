import { CashFilterType } from 'src/common/types';
import { GroupCashId } from './group-cash.type';

export const InitGroupCashData = [
  {
    id: GroupCashId.SERVICE_FEE,
    groupName: 'Phí hồ sơ',
    filterType: CashFilterType.SERVICE_FEE,
    cashType: 'payment',
  },
  {
    id: GroupCashId.PARTNER,
    groupName: 'Tiền cộng tác viên',
    filterType: CashFilterType.PARTNER,
    cashType: 'payment',
  },
  {
    id: GroupCashId.PAY_ROLL,
    groupName: 'Tiền lương nhân viên',
    filterType: CashFilterType.PAY_ROLL,
    cashType: 'payment',
  },
  {
    id: GroupCashId.PAYMENT_ORTHER,
    groupName: 'Chi tiêu khác',
    filterType: CashFilterType.PAYMENT_ORTHER,
    cashType: 'payment',
  },
  {
    id: GroupCashId.INIT,
    groupName: 'Tiền quỹ',
    filterType: CashFilterType.INIT,
    cashType: 'receipt',
  },
];
