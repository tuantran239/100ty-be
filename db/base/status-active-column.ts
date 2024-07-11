import { StatusDB } from 'db/type';
import { TableColumn } from 'typeorm';

export const StatusActiveColumn = new TableColumn({
  name: 'status',
  type: 'varchar',
  isNullable: false,
  default: `'${StatusDB.ACTIVE}'`,
});
