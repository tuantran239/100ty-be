import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsIsDeductionMoneyUserIdTableCash1711956510520
  implements MigrationInterface
{
  name = 'AddColumnsIsDeductionMoneyUserIdTableCash1711956510520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('cash', [
      new TableColumn({
        name: 'isDeductionMoney',
        type: 'boolean',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    ]);

    await queryRunner.createForeignKeys('cash', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('cash', ['userId', 'isDeductionMoney']);
  }
}
