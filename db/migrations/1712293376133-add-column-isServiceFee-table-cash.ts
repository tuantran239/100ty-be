import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnIsServiceFeeTableCash1712293376133
  implements MigrationInterface
{
  name = 'AddColumnIsServiceFeeTableCash1712293376133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'isServiceFee',
        type: 'boolean',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'isServiceFee');
  }
}
