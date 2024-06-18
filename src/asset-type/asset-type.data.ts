import { GroupCashStatus } from 'src/group-cash/group-cash.type';

export const AssetTypeInitData = [
  {
    id: 'xe_may',
    name: 'Xe Máy',
    properties: ['Khung Xe', 'Biển Số Xe'],
    status: GroupCashStatus.ACTIVE,
  },
  {
    id: 'o_to',
    name: 'Ô Tô',
    properties: ['Khung Xe', 'Biển Số Xe'],
    status: GroupCashStatus.ACTIVE,
  },
  {
    id: 'bat_dong_san',
    name: 'Bất Động Sản',
    properties: ['Giấy tờ'],
    status: GroupCashStatus.ACTIVE,
  },
];
