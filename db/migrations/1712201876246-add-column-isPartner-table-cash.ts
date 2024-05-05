import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnIsPartnerTableCash1712201876246
  implements MigrationInterface
{
  name = 'AddColumnIsPartnerTableCash1712201876246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'isPartner',
        type: 'boolean',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'isPartner');
  }
}
