import { SoftDeleteColumn } from 'db/base/soft-delete-column';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableWorkspace1719976895091 implements MigrationInterface {
  name = 'CreateTableWorkspace1719976895091';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workspace',
        columns: [
          ...SoftDeleteColumn,
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
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workspace');
  }
}
