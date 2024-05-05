import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableCustomer1709104753391 implements MigrationInterface {
  name = 'CreateTableCustomer1709104753391';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customer',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'full_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'identity_card_no',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'identity_card_date',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'identity_card_place',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            default: null,
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
    await queryRunner.dropTable('customer');
  }
}
