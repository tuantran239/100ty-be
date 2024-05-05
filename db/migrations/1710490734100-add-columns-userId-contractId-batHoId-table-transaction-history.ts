import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsUserIdContractIdBatHoIdTableTransactionHistory1710490734100
  implements MigrationInterface
{
  name =
    'AddColumnsUserIdContractIdBatHoIdTableTransactionHistory1710490734100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('transaction_history', [
      new TableColumn({
        name: 'batHoId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'contractId',
        type: 'varchar',
        isNullable: false,
      }),
    ]);

    await queryRunner.createForeignKeys('transaction_history', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['batHoId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bat_ho',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('transaction_history', [
      'userId',
      'batHoId',
      'contractId',
    ]);
  }
}
