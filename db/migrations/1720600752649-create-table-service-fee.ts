import { SoftDeleteColumn } from 'db/base/soft-delete-column';
import { WorkspcaeColumn } from 'db/base/workspace-column';
import { StatusDB } from 'db/type';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableServiceFee1720600752649 implements MigrationInterface {
  name = 'CreateTableServiceFee1720600752649';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_fee',
        columns: [
          ...SoftDeleteColumn,
          { ...WorkspcaeColumn.tableWorkspaceId },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: `'${StatusDB.ACTIVE}'`,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'service_fee',
      WorkspcaeColumn.tableForeignKeyWorkspace,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('service_fee');
  }
}
