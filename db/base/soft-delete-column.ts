import { TableColumnOptions } from 'typeorm';
import { BaseColumn } from './base-column';

export const SoftDeleteColumn: TableColumnOptions[] = [
  ...BaseColumn,
  {
    name: 'deleted_at',
    type: 'timestamptz',
    isNullable: true,
    default: null,
  },
];
