import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

enum GroupCashType {
  OUT_SITE = 'out_site',
  CONTRACT = 'contract',
}

export class AddColumnTypeTableGroupCash1718704134111
  implements MigrationInterface
{
  name = 'AddColumnTypeTableGroupCash1718704134111';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'group_cash',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: false,
        default: `'${GroupCashType.OUT_SITE as string}'`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('group_cash', 'type');
  }
}
