import { TableColumn, TableForeignKey } from 'typeorm';

export const WorkspcaeColumn = {
  tableWorkspaceId: new TableColumn({
    name: 'workspaceId',
    type: 'varchar',
    isNullable: true,
  }),
  tableForeignKeyWorkspace: new TableForeignKey({
    columnNames: ['workspaceId'],
    referencedColumnNames: ['id'],
    referencedTableName: 'workspace',
    onDelete: 'CASCADE',
  }),
};
