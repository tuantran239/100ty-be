import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnTypeTablePaymentHistory1716517241239
  implements MigrationInterface
{
  name = 'AddColumnTypeTablePaymentHistory1716517241239';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payment_history',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_history', 'type');
  }
}
