import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTablePaymentHistory1710212926399
  implements MigrationInterface
{
  name = 'CreateTablePaymentHistory1710212926399';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payment_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'rowId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'paymentStatus',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'payDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'startDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'endDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'interestMoney',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'otherMoney',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'payMoney',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'payNeed',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'note',
            type: 'varchar',
            isNullable: true,
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
    await queryRunner.query(`DROP TABLE "base_entity"`);
  }
}
