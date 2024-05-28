import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTableTransactionHistoryExtendPeriod1716882038057
  implements MigrationInterface
{
  name = 'CreateTableTransactionHistoryExtendPeriod1716882038057';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'extended_period_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'periodNumber',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'extendedDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'pawnId',
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

    await queryRunner.createForeignKey(
      'extended_period_history',
      new TableForeignKey({
        columnNames: ['pawnId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pawn',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('extended_period_history');
  }
}
