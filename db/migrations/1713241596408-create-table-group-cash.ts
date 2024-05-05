import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableGroupCash1713241596408 implements MigrationInterface {
  name = 'CreateTableGroupCash1713241596408';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'group_cash',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'groupName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'cashType',
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
            default: 'now()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('group_cash');
  }
}
