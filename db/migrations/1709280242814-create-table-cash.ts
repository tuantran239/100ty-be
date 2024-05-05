import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableCash1709280242814 implements MigrationInterface {
  name = 'CreateTableCash1709280242814';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cash',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'code',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'staff',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'traders',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'note',
            type: 'varchar',
            isNullable: true,
            default: true,
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
    await queryRunner.dropTable('cash');
  }
}
