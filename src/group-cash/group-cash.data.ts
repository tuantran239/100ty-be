import { CashFilterType, CashType } from 'src/cash/cash.type';
import { GroupCashContractId, GroupCashId, GroupCashType } from './group-cash.type';

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

export const InitGroupCashContractData = [
  {
    id: GroupCashContractId.PAYMENT_CONTRACT,
    groupName: 'Tiền giải ngân',
    filterType: CashFilterType.PAYMENT_CONTRACT,
    cashType: 'payment',
    type: GroupCashType.CONTRACT
  },
  {
    id: GroupCashContractId.RECEIPT_CONTRACT,
    groupName: 'Tiền thu hợp đồng',
    filterType: CashFilterType.RECEIPT_CONTRACT,
    cashType: CashType.RECEIPT,
    type: GroupCashType.CONTRACT
  },
  {
    id: GroupCashContractId.DEDUCTION,
    groupName: 'Tiền cắt trước',
    filterType: CashFilterType.DEDUCTION,
    cashType: CashType.RECEIPT,
    type: GroupCashType.CONTRACT
  },
  {
    id: GroupCashContractId.LOAN_MORE_CONTRACT,
    groupName: 'Tiền vay thêm',
    filterType: CashFilterType.LOAN_MORE_CONTRACT,
    cashType: 'payment',
    type: GroupCashType.CONTRACT
  },
  {
    id: GroupCashContractId.DOWN_ROOT_MONEY,
    groupName: 'Tiền trả bớt gốc',
    filterType: CashFilterType.DOWN_ROOT_MONEY,
    cashType: 'receipt',
    type: GroupCashType.CONTRACT
  },
];
