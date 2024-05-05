import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnMaturityDateTableBatHo1711333605190
  implements MigrationInterface
{
  name = 'AddColumnMaturityDateTableBatHo1711333605190';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'maturityDate',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'maturityDate');
  }
}
