import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnPartnerTableBatHo1712200526538
  implements MigrationInterface
{
  name = 'AddColumnPartnerTableBatHo1712200526538';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'partner',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'partner');
  }
}
