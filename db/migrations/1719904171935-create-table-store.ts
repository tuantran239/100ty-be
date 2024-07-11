import { StatusDB } from 'db/type';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableStore1719904171935 implements MigrationInterface {
  name = 'CreateTableStore1719904171935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'store',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: `'${StatusDB.ACTIVE}'`,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
            default: null,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: null,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('store');
  }
}
