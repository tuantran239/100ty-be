import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnWorkspaceIdTableCustomer1719990280462
  implements MigrationInterface
{
  name = 'AddColumnWorkspaceIdTableCustomer1719990280462';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableWorkspaceId = new TableColumn({
      name: 'workspaceId',
      type: 'varchar',
      isNullable: true,
    });

    const tableForeignKeyWorkspace = new TableForeignKey({
      columnNames: ['workspaceId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'workspace',
      onDelete: 'CASCADE',
    });

    await queryRunner.addColumn('customer', tableWorkspaceId);

    await queryRunner.createForeignKey('customer', tableForeignKeyWorkspace);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customer', 'workspaceId');
  }
}
