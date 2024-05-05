import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnStatusTableGroupCash1713842396559
  implements MigrationInterface
{
  name = 'AddColumnStatusTableGroupCash1713842396559';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'group_cash',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        isNullable: false,
        default: `'active'`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('group_cash', 'status');
  }
}
