import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnIsInitCashTableCash1712282065747
  implements MigrationInterface
{
  name = 'AddColumnIsInitCashTableCash1712282065747';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'isInitCash',
        type: 'boolean',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'isInitCash');
  }
}
