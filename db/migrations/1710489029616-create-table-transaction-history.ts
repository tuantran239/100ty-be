import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableTransactionHistory1710489029616
  implements MigrationInterface
{
  name = 'CreateTableTransactionHistory1710489029616';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transaction_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'moneyAdd',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'moneySub',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'otherMoney',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'createAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'content',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'note',
            type: 'varchar',
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
    await queryRunner.dropTable('transaction_history');
  }
}
