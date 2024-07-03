import { TablesInWorkspace } from 'db/constant';
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsReferenceWorkspace1719980095450
  implements MigrationInterface
{
  name = 'AddColumnsReferenceWorkspace1719980095450';

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

    await Promise.all(
      TablesInWorkspace.map(async (table) => {
        await queryRunner.addColumn(table, tableWorkspaceId);
      }),
    );

    await Promise.all(
      TablesInWorkspace.map(async (table) => {
        await queryRunner.createForeignKey(table, tableForeignKeyWorkspace);
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await Promise.all(
      TablesInWorkspace.map(async (table) => {
        await queryRunner.dropColumn(table, 'workspaceId');
      }),
    );
  }
}
