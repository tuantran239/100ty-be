import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnDebitStatusTableBatHo1709634627148
  implements MigrationInterface
{
  name = 'AddColumnDebitStatusTableBatHo1709634627148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'debitStatus',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'debitStatus');
  }
}
