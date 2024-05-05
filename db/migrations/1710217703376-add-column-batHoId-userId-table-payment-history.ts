import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnBatHoIdUserIdTablePaymentHistory1710217703376
  implements MigrationInterface
{
  name = 'AddColumnBatHoIdUserIdTablePaymentHistory1710217703376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('payment_history', [
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
        name: 'contractType',
        type: 'varchar',
        isNullable: false,
      }),
    ]);

    await queryRunner.createForeignKeys('payment_history', [
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
    await queryRunner.dropColumns('payment_history', [
      'userId',
      'batHoId',
      'contractType',
    ]);
  }
}
