import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnIsMaturityTablePaymentHistory1711966165361
  implements MigrationInterface
{
  name = 'AddColumnIsMaturityTablePaymentHistory1711966165361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payment_history',
      new TableColumn({
        name: 'isMaturity',
        type: 'boolean',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_history', 'isMaturity');
  }
}
