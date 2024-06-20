export const GroupCashId = {
  SERVICE_FEE: 'phi_ho_so',
  PARTNER: 'ctv',
  PAY_ROLL: 'luong_nv',
  PAYMENT_ORTHER: 'chi_tieu_khac',
  INIT: 'tien_quy',
};

export const GroupCashContractId = {
  PAYMENT_CONTRACT: 'giai_ngan_hop_dong',
  RECEIPT_CONTRACT: 'thu_hop_dong',
  DEDUCTION: 'tien_cat',
  LOAN_MORE_CONTRACT: 'tien_vay_them',
  DOWN_ROOT_MONEY: 'tra_bot_goc',
};

export enum GroupCashStatus {
  ACTIVE = 'active',
  OFF = 'off',
}

export enum GroupCashType {
  OUT_SITE = 'out_site',
  CONTRACT = 'contract',
}
