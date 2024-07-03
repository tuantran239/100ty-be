import { TableColumnOptions } from 'typeorm';

export const BaseColumn: TableColumnOptions[] = [
  {
    name: 'id',
    type: 'varchar',
    isPrimary: true,
  },
  {
    name: 'created_at',
    type: 'timestamptz',
    default: 'now()',
  },
  {
    name: 'updated_at',
    type: 'timestamptz',
    isNullable: true,
    default: null,
  },
];
