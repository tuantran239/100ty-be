import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableBatHo1709631444981 implements MigrationInterface {
  name = 'CreateTableBatHo1709631444981';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bat_ho',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'totalPaymentDue',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'amountPaidByCustomer',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'loanDuration',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'numberOfPayments',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'interestPaymentType',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'noteContract',
            type: 'text',
            isNullable: true,
            default: null,
          },
          {
            name: 'loanDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'serviceFee',
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
    await queryRunner.dropTable('bat_ho');
  }
}
